import { useState, useRef } from 'react'
import { LogIn, Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle, XCircle, Loader, Camera, AlertTriangle } from 'lucide-react'
import { authAPI } from '../utils/api'
import Tesseract from 'tesseract.js'

function Login({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Guest registration fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regIdentityNumber, setRegIdentityNumber] = useState('')
  const [regAddress, setRegAddress] = useState('')
  const [regIdentityPhoto, setRegIdentityPhoto] = useState(null)

  // KTP validation states
  const [ktpValid, setKtpValid] = useState(null) // null = belum input, true = valid, false = invalid
  const [ktpTouched, setKtpTouched] = useState(false)

  // KTP photo validation states
  const [photoPreview, setPhotoPreview] = useState(null)
  const [ocrStatus, setOcrStatus] = useState('idle') // idle, scanning, success, error, mismatch
  const [ocrExtractedNumber, setOcrExtractedNumber] = useState('')
  const [ocrProgress, setOcrProgress] = useState(0)
  const fileInputRef = useRef(null)

  // Validate KTP number (must be exactly 16 digits)
  const validateKTP = (value) => {
    const digitsOnly = value.replace(/\D/g, '')
    if (digitsOnly.length === 0) {
      setKtpValid(null)
      return
    }
    setKtpValid(digitsOnly.length === 16)
  }

  const handleKTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow digits
    if (value.length <= 16) {
      setRegIdentityNumber(value)
      setKtpTouched(true)
      validateKTP(value)
    }
  }

  // Process KTP photo with OCR
  const processKTPPhoto = async (file) => {
    setOcrStatus('scanning')
    setOcrProgress(0)
    setOcrExtractedNumber('')

    try {
      const result = await Tesseract.recognize(
        file,
        'ind+eng', // Indonesian + English language
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100))
            }
          }
        }
      )

      const text = result.data.text
      console.log('OCR Result:', text)

      // Look for 16-digit numbers in the extracted text (NIK pattern)
      const nikPatterns = text.match(/\b\d{16}\b/g)
      // Also try sequences of digits that might be broken up
      const allDigitSequences = text.match(/\d+/g) || []
      const concatenated = allDigitSequences.join('')
      
      let foundNIK = ''

      if (nikPatterns && nikPatterns.length > 0) {
        foundNIK = nikPatterns[0]
      } else {
        // Try to find a 16-digit sequence in concatenated digits
        for (let i = 0; i <= concatenated.length - 16; i++) {
          const candidate = concatenated.substring(i, i + 16)
          // NIK starts with province code (11-99), so first 2 digits should be valid
          const provinceCode = parseInt(candidate.substring(0, 2))
          if (provinceCode >= 11 && provinceCode <= 99) {
            foundNIK = candidate
            break
          }
        }
      }

      if (foundNIK) {
        setOcrExtractedNumber(foundNIK)
        // Check if it matches the entered KTP number
        if (regIdentityNumber && foundNIK === regIdentityNumber) {
          setOcrStatus('success')
        } else if (regIdentityNumber) {
          setOcrStatus('mismatch')
        } else {
          setOcrStatus('success')
          // Auto-fill the KTP number if not yet entered
          setRegIdentityNumber(foundNIK)
          setKtpValid(true)
          setKtpTouched(true)
        }
      } else {
        // Check if the image looks like a KTP by looking for keywords
        const ktpKeywords = ['NIK', 'PROVINSI', 'KABUPATEN', 'KOTA', 'Nama', 'Tempat', 'Lahir', 'Jenis Kelamin', 'Alamat', 'RT', 'RW', 'KARTU TANDA PENDUDUK', 'KTP']
        const hasKTPKeywords = ktpKeywords.some(kw => text.toUpperCase().includes(kw.toUpperCase()))
        
        if (hasKTPKeywords) {
          setOcrStatus('success')
          setOcrExtractedNumber('Terdeteksi sebagai KTP (nomor tidak terbaca jelas)')
        } else {
          setOcrStatus('error')
        }
      }
    } catch (err) {
      console.error('OCR Error:', err)
      setOcrStatus('error')
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5MB')
      return
    }

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Format foto harus JPG atau PNG')
      return
    }

    setRegIdentityPhoto(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result)
    }
    reader.readAsDataURL(file)

    // Run OCR
    processKTPPhoto(file)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authAPI.login(email, password)

      if (data.success) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        
        if (onLogin) {
          onLogin(data.data.user)
        }
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Pastikan backend sudah berjalan.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate KTP number
    if (regIdentityNumber.length !== 16) {
      setError('Nomor KTP harus tepat 16 digit')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', regName)
      formData.append('email', regEmail)
      formData.append('password', regPassword)
      formData.append('phone', regPhone)
      formData.append('identity_number', regIdentityNumber)
      formData.append('address', regAddress)
      if (regIdentityPhoto) {
        formData.append('identity_photo', regIdentityPhoto)
      }

      const data = await authAPI.registerGuest(formData)

      if (data.success) {
        setSuccess('Registrasi berhasil! Akun Anda menunggu verifikasi admin. Silakan login setelah diverifikasi.')
        setTimeout(() => {
          setMode('login')
          setEmail(regEmail)
          setSuccess('')
        }, 3000)
      }
    } catch (err) {
      setError(err.message || 'Gagal mendaftar. Periksa kembali data Anda.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setError('')
    setSuccess('')
    setRegName('')
    setRegEmail('')
    setRegPassword('')
    setRegPhone('')
    setRegIdentityNumber('')
    setRegAddress('')
    setRegIdentityPhoto(null)
    setKtpValid(null)
    setKtpTouched(false)
    setPhotoPreview(null)
    setOcrStatus('idle')
    setOcrExtractedNumber('')
    setOcrProgress(0)
  }

  // KTP input border/indicator style
  const getKTPInputStyle = () => {
    if (!ktpTouched || ktpValid === null) return {}
    return {
      borderColor: ktpValid ? '#22c55e' : '#ef4444',
      background: ktpValid ? '#f0fdf4' : '#fef2f2',
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        {/* LEFT SIDE - BRANDING */}
        <div className="login-brand">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-mark">S</div>
              <div>
                <h1>SISETRIS</h1>
                <p>Sistem Pengelolaan Aset & Inventaris</p>
              </div>
            </div>

            <div className="brand-features">
              <div className="feature-item">
                <span>✓</span>
                <p>Kelola aset dengan mudah</p>
              </div>
              <div className="feature-item">
                <span>✓</span>
                <p>Tracking real-time</p>
              </div>
              <div className="feature-item">
                <span>✓</span>
                <p>Peminjaman terstruktur</p>
              </div>
              <div className="feature-item">
                <span>✓</span>
                <p>Laporan otomatis</p>
              </div>
            </div>

            <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(255,255,255,0.12)', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, opacity: 0.9 }}>💡 Mekanisme Biaya:</p>
              <div style={{ fontSize: '12px', opacity: 0.85, lineHeight: 1.6 }}>
                <p style={{ margin: '4px 0' }}>🎓 <strong>Civitas Kampus</strong> → Diskon 50%</p>
                <p style={{ margin: '4px 0' }}>👤 <strong>Tamu / Eksternal</strong> → Tarif penuh + Deposit 50%</p>
              </div>
            </div>
          </div>

          <p className="brand-footer">
            © 2026 SISETRIS. Universitas Maritim
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-form-side">
          <div className="form-content">
            {mode === 'login' ? (
              <>
                {/* LOGIN FORM */}
                <div className="form-header">
                  <h2>Selamat Datang</h2>
                  <p>Silakan login untuk melanjutkan</p>
                </div>

                {error && (
                  <div className="alert alert-error">{error}</div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <div className="password-field">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-login"
                    disabled={loading}
                  >
                    {loading ? (
                      <>Loading...</>
                    ) : (
                      <>
                        <LogIn size={18} />
                        <span>Login</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="form-footer">
                  <p>
                    Bukan civitas kampus?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); resetForm(); setMode('register') }}>
                      Daftar sebagai Tamu
                    </a>
                  </p>
                  <p className="demo-info">
                    <strong>Demo Credentials:</strong><br />
                    admin@sisetris.id / password123
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* GUEST REGISTRATION FORM */}
                <div className="form-header">
                  <button
                    onClick={() => { resetForm(); setMode('login') }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', color: '#16a99c', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0, marginBottom: '12px' }}
                  >
                    <ArrowLeft size={16} /> Kembali ke Login
                  </button>
                  <h2>Daftar sebagai Tamu</h2>
                  <p>Isi data diri Anda untuk mengajukan peminjaman aset</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && (
                  <div className="alert" style={{ background: '#e4f6f0', color: '#299579', border: '1px solid #b8e6d8' }}>
                    {success}
                  </div>
                )}

                <div style={{ background: '#fff4dd', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#8A5F09', marginBottom: '16px', lineHeight: 1.5 }}>
                  ⚠️ <strong>Perhatian:</strong> Sebagai tamu, Anda dikenakan tarif penuh (tanpa diskon kampus) dan wajib membayar deposit 50%. Akun perlu diverifikasi admin sebelum bisa meminjam.
                </div>

                <form onSubmit={handleGuestRegister}>
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Nama Lengkap *</label>
                      <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required disabled={loading} placeholder="Nama sesuai KTP" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Email *</label>
                        <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required disabled={loading} placeholder="email@contoh.com" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Password *</label>
                        <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required disabled={loading} placeholder="Min. 6 karakter" minLength={6} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>No. Telepon *</label>
                        <input type="text" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required disabled={loading} placeholder="08xxxxxxxxxx" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>No. KTP / NIK *</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={regIdentityNumber}
                            onChange={handleKTPChange}
                            required
                            disabled={loading}
                            placeholder="Masukkan 16 digit NIK"
                            maxLength={16}
                            style={{
                              ...getKTPInputStyle(),
                              paddingRight: '36px',
                              transition: 'all 0.3s ease',
                            }}
                          />
                          {/* Validation indicator icon */}
                          {ktpTouched && ktpValid !== null && (
                            <div style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              display: 'flex',
                              alignItems: 'center',
                            }}>
                              {ktpValid ? (
                                <CheckCircle size={18} color="#22c55e" />
                              ) : (
                                <XCircle size={18} color="#ef4444" />
                              )}
                            </div>
                          )}
                        </div>
                        {/* Digit counter */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '4px',
                        }}>
                          <span style={{
                            fontSize: '11px',
                            color: ktpTouched ? (ktpValid ? '#22c55e' : '#ef4444') : '#999',
                            fontWeight: ktpTouched ? 600 : 400,
                            transition: 'all 0.3s',
                          }}>
                            {ktpTouched && regIdentityNumber.length > 0 ? (
                              ktpValid ? '✓ NIK valid (16 digit)' : `✗ ${regIdentityNumber.length}/16 digit`
                            ) : (
                              'Harus tepat 16 digit'
                            )}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            color: '#bbb',
                            fontFamily: 'monospace',
                          }}>
                            {regIdentityNumber.length}/16
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Alamat Lengkap *</label>
                      <input type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} required disabled={loading} placeholder="Alamat sesuai KTP" />
                    </div>

                    {/* KTP Photo Upload with OCR Validation */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Foto KTP / Identitas *</label>
                      
                      <div
                        className="ktp-upload-area"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          padding: photoPreview ? '0' : '20px',
                          background: photoPreview ? 'transparent' : '#f8f8fa',
                          border: `2px dashed ${
                            ocrStatus === 'success' ? '#22c55e' :
                            ocrStatus === 'error' ? '#ef4444' :
                            ocrStatus === 'mismatch' ? '#f59e0b' :
                            '#ddd'
                          }`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handlePhotoChange}
                          required={!regIdentityPhoto}
                          disabled={loading}
                          style={{ display: 'none' }}
                        />

                        {photoPreview ? (
                          <div style={{ position: 'relative' }}>
                            <img
                              src={photoPreview}
                              alt="Preview KTP"
                              style={{
                                width: '100%',
                                maxHeight: '160px',
                                objectFit: 'cover',
                                display: 'block',
                                borderRadius: '10px',
                              }}
                            />
                            {/* OCR Scanning overlay */}
                            {ocrStatus === 'scanning' && (
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '10px',
                              }}>
                                <Loader size={24} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                                <span style={{ color: '#fff', fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>
                                  Memverifikasi KTP... {ocrProgress}%
                                </span>
                                <div style={{
                                  width: '60%',
                                  height: '4px',
                                  background: 'rgba(255,255,255,0.2)',
                                  borderRadius: '2px',
                                  marginTop: '6px',
                                  overflow: 'hidden',
                                }}>
                                  <div style={{
                                    width: `${ocrProgress}%`,
                                    height: '100%',
                                    background: '#22c55e',
                                    borderRadius: '2px',
                                    transition: 'width 0.3s',
                                  }} />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <Camera size={28} color="#bbb" style={{ marginBottom: '8px' }} />
                            <p style={{ margin: 0, fontSize: '12px', color: '#888', fontWeight: 600 }}>
                              Klik untuk upload foto KTP
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#bbb' }}>
                              Format: JPG/PNG, maks 5MB
                            </p>
                          </div>
                        )}
                      </div>

                      {/* OCR Result Feedback */}
                      {ocrStatus !== 'idle' && ocrStatus !== 'scanning' && (
                        <div style={{
                          marginTop: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          background: ocrStatus === 'success' ? '#f0fdf4' :
                                     ocrStatus === 'mismatch' ? '#fffbeb' : '#fef2f2',
                          border: `1px solid ${
                            ocrStatus === 'success' ? '#bbf7d0' :
                            ocrStatus === 'mismatch' ? '#fde68a' : '#fecaca'
                          }`,
                          color: ocrStatus === 'success' ? '#166534' :
                                 ocrStatus === 'mismatch' ? '#92400e' : '#991b1b',
                        }}>
                          {ocrStatus === 'success' ? (
                            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                          ) : ocrStatus === 'mismatch' ? (
                            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                          ) : (
                            <XCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                          )}
                          <div>
                            {ocrStatus === 'success' && (
                              <>
                                <strong>KTP Terverifikasi</strong>
                                {ocrExtractedNumber && !ocrExtractedNumber.includes('Terdeteksi') && (
                                  <div style={{ marginTop: '2px', opacity: 0.8 }}>
                                    NIK terdeteksi: {ocrExtractedNumber}
                                  </div>
                                )}
                                {ocrExtractedNumber.includes('Terdeteksi') && (
                                  <div style={{ marginTop: '2px', opacity: 0.8 }}>
                                    {ocrExtractedNumber}
                                  </div>
                                )}
                              </>
                            )}
                            {ocrStatus === 'mismatch' && (
                              <>
                                <strong>NIK Tidak Cocok</strong>
                                <div style={{ marginTop: '2px', opacity: 0.8 }}>
                                  NIK di foto: {ocrExtractedNumber}<br />
                                  NIK yang diinput: {regIdentityNumber || '(belum diisi)'}
                                </div>
                              </>
                            )}
                            {ocrStatus === 'error' && (
                              <>
                                <strong>Foto tidak terdeteksi sebagai KTP</strong>
                                <div style={{ marginTop: '2px', opacity: 0.8 }}>
                                  Pastikan foto KTP jelas, tidak blur, dan menampilkan seluruh bagian KTP
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-login"
                    disabled={loading || (ktpTouched && !ktpValid)}
                    style={{ marginTop: '20px' }}
                  >
                    {loading ? 'Mendaftar...' : (
                      <><UserPlus size={18} /> <span>Daftar sebagai Tamu</span></>
                    )}
                  </button>
                </form>

                <div className="form-footer">
                  <p>
                    Sudah punya akun?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); resetForm(); setMode('login') }}>Login di sini</a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
