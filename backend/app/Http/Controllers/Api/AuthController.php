<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:SUPER_ADMIN,ADMIN_UNIT,OPERATOR,BORROWER,VIEWER',
            'unit' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'name' => $request->name,
            'phone' => $request->phone,
            'role' => $request->role,
            'unit' => $request->unit,
            'is_guest' => false,
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'REGISTER',
            'entity' => 'User',
            'entity_id' => $user->id,
            'description' => "User {$user->name} melakukan registrasi",
            'ip_address' => $request->ip(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil',
            'data' => [
                'user' => $user,
                'token' => $token
            ]
        ], 201);
    }

    public function registerGuest(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'identity_number' => 'required|string|unique:users,identity_number',
            'address' => 'required|string',
            'identity_photo' => 'required|image|mimes:jpeg,jpg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        // Handle file upload
        $identityPhotoPath = null;
        if ($request->hasFile('identity_photo')) {
            $file = $request->file('identity_photo');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/identity'), $filename);
            $identityPhotoPath = '/uploads/identity/' . $filename;
        }

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'name' => $request->name,
            'phone' => $request->phone,
            'role' => 'GUEST',
            'is_guest' => true,
            'identity_number' => $request->identity_number,
            'identity_photo' => $identityPhotoPath,
            'address' => $request->address,
            'verification_status' => 'BELUM_TERVERIFIKASI',
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'REGISTER_GUEST',
            'entity' => 'User',
            'entity_id' => $user->id,
            'description' => "Guest {$user->name} melakukan registrasi",
            'ip_address' => $request->ip(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi guest berhasil. Menunggu verifikasi admin.',
            'data' => [
                'user' => $user,
                'token' => $token
            ]
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda telah dinonaktifkan. Hubungi admin.'
            ], 403);
        }

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'LOGIN',
            'entity' => 'User',
            'entity_id' => $user->id,
            'description' => "User {$user->name} melakukan login",
            'ip_address' => $request->ip(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => $user,
                'token' => $token
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil'
        ]);
    }

    public function profile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'unit' => 'nullable|string|max:255',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $user->update($request->only(['name', 'phone', 'unit', 'address']));

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'UPDATE_PROFILE',
            'entity' => 'User',
            'entity_id' => $user->id,
            'description' => "User {$user->name} mengupdate profil",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diupdate',
            'data' => $user
        ]);
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password lama tidak sesuai'
            ], 400);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'CHANGE_PASSWORD',
            'entity' => 'User',
            'entity_id' => $user->id,
            'description' => "User {$user->name} mengubah password",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah'
        ]);
    }
}
