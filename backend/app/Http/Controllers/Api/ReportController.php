<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Loan;
use App\Models\Payment;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithTitle;

class ReportController extends Controller
{
    private function getAssetQuery()
    {
        $user = auth()->user();
        $query = Asset::with(['createdBy', 'unit', 'location']);
        
        if ($user->isOperator() && $user->unit_id) {
            $query->where('unit_id', $user->unit_id);
        }
        
        return $query;
    }

    public function exportAssetsExcel(Request $request)
    {
        $query = $this->getAssetQuery();
        
        if ($request->has('unit_id')) {
            $query->where('unit_id', $request->unit_id);
        }

        $assets = $query->orderBy('kode_barang')->get();
        
        $headings = ['Kode Barang', 'NUP', 'Kode Register', 'Nama Barang', 'Jenis BMN', 'Merk', 'Tipe',
                     'Kondisi', 'Unit', 'Lokasi', 'Status', 'Tgl Perolehan', 'Nilai Perolehan',
                     'Nilai Buku', 'Intra/Ekstra', 'Bisa Dipinjam', 'Harga Sewa', 'Satuan Sewa',
                     'Dibuat Oleh', 'Tanggal Dibuat'];
        
        $data = $assets->map(function($asset) {
            return [
                'Kode Barang' => $asset->kode_barang,
                'NUP' => $asset->nup,
                'Kode Register' => $asset->kode_register,
                'Nama Barang' => $asset->nama_barang,
                'Jenis BMN' => $asset->jenis_bmn,
                'Merk' => $asset->merk,
                'Tipe' => $asset->tipe,
                'Kondisi' => $asset->kondisi,
                'Unit' => $asset->unit->name ?? 'Gudang',
                'Lokasi' => $asset->location->name ?? '-',
                'Status' => $asset->status,
                'Tgl Perolehan' => $asset->tanggal_perolehan ?? '-',
                'Nilai Perolehan' => $asset->nilai_perolehan ?? 0,
                'Nilai Buku' => $asset->nilai_buku ?? 0,
                'Intra/Ekstra' => $asset->intra_ekstra ?? '-',
                'Bisa Dipinjam' => $asset->is_borrowable ? 'Ya' : 'Tidak',
                'Harga Sewa' => $asset->rental_price ?? 0,
                'Satuan Sewa' => $asset->rental_unit ?? '-',
                'Dibuat Oleh' => $asset->createdBy->name ?? '-',
                'Tanggal Dibuat' => $asset->created_at->format('d-m-Y'),
            ];
        });

        return Excel::download(new class($data, $headings) implements FromCollection, WithHeadings {
            private $data;
            private $headings;
            
            public function __construct($data, $headings) {
                $this->data = $data;
                $this->headings = $headings;
            }
            
            public function collection() {
                return $this->data;
            }
            
            public function headings(): array {
                return $this->headings;
            }
        }, 'Laporan_Aset_BMN.xlsx');
    }

    public function exportAssetsByConditionExcel(Request $request)
    {
        $conditions = ['Baik', 'Rusak Ringan', 'Rusak Berat'];
        $user = auth()->user();
        $unitId = $request->get('unit_id');
        $isOperator = $user->isOperator() && $user->unit_id;
        
        return Excel::download(new class($conditions, $isOperator, $user, $unitId) implements WithMultipleSheets {
            private $conditions;
            private $isOperator;
            private $user;
            private $unitId;
            
            public function __construct($conditions, $isOperator, $user, $unitId) {
                $this->conditions = $conditions;
                $this->isOperator = $isOperator;
                $this->user = $user;
                $this->unitId = $unitId;
            }
            
            public function sheets(): array {
                $sheets = [];
                
                foreach ($this->conditions as $condition) {
                    $query = Asset::with(['unit', 'location'])->where('kondisi', $condition);
                    
                    if ($this->isOperator) {
                        $query->where('unit_id', $this->user->unit_id);
                    } elseif ($this->unitId) {
                        $query->where('unit_id', $this->unitId);
                    }
                    
                    $assets = $query->orderBy('kode_barang')->get();
                    
                    $data = $assets->map(function($asset) {
                        return [
                            'Kode Barang' => $asset->kode_barang,
                            'NUP' => $asset->nup,
                            'Nama Barang' => $asset->nama_barang,
                            'Jenis BMN' => $asset->jenis_bmn,
                            'Merk' => $asset->merk,
                            'Unit' => $asset->unit->name ?? 'Gudang',
                            'Lokasi' => $asset->location->name ?? '-',
                            'Status' => $asset->status,
                            'Nilai Perolehan' => $asset->nilai_perolehan ?? 0,
                        ];
                    });
                    
                    $sheetTitle = $condition;
                    $sheetHeadings = ['Kode Barang', 'NUP', 'Nama Barang', 'Jenis BMN', 'Merk', 'Unit', 'Lokasi', 'Status', 'Nilai Perolehan'];
                    
                    $sheets[] = new class($data, $sheetTitle, $sheetHeadings) implements FromCollection, WithHeadings, WithTitle {
                        private $data;
                        private $sheetTitle;
                        private $sheetHeadings;
                        
                        public function __construct($data, $sheetTitle, $sheetHeadings) {
                            $this->data = $data;
                            $this->sheetTitle = $sheetTitle;
                            $this->sheetHeadings = $sheetHeadings;
                        }
                        
                        public function collection() {
                            return $this->data;
                        }
                        
                        public function headings(): array {
                            return $this->sheetHeadings;
                        }
                        
                        public function title(): string {
                            return $this->sheetTitle;
                        }
                    };
                }
                
                return $sheets;
            }
        }, 'Laporan_Aset_Per_Kondisi.xlsx');
    }

    public function exportRevenueExcel()
    {
        $payments = Payment::with(['loan.asset.unit', 'loan.borrower'])
            ->where('status', 'LUNAS')
            ->orderBy('paid_at', 'desc')
            ->get();
        
        $headings = ['Tanggal Bayar', 'Peminjam', 'Tipe', 'Unit Aset', 'Aset', 'Kode Barang', 'Total Hari', 'Biaya Sewa', 'Diskon (%)', 'Diskon (Rp)', 'Denda Terlambat', 'Total Bayar', 'Metode'];
        
        $data = $payments->map(function($payment) {
            return [
                'Tanggal Bayar' => $payment->paid_at ? $payment->paid_at->format('d-m-Y') : '-',
                'Peminjam' => $payment->loan->borrower->name,
                'Tipe' => $payment->loan->borrower->is_guest ? 'Tamu' : 'Kampus',
                'Unit Aset' => $payment->loan->asset->unit->name ?? 'Gudang',
                'Aset' => $payment->loan->asset->nama_barang,
                'Kode Barang' => $payment->loan->asset->kode_barang,
                'Total Hari' => $payment->loan->total_days,
                'Biaya Sewa' => $payment->loan->total_rental_cost,
                'Diskon (%)' => $payment->loan->discount_percent,
                'Diskon (Rp)' => $payment->loan->discount_amount,
                'Denda Terlambat' => $payment->loan->late_fee,
                'Total Bayar' => $payment->amount,
                'Metode' => $payment->payment_method ?? '-',
            ];
        });

        return Excel::download(new class($data, $headings) implements FromCollection, WithHeadings {
            private $data;
            private $headings;
            
            public function __construct($data, $headings) {
                $this->data = $data;
                $this->headings = $headings;
            }
            
            public function collection() {
                return $this->data;
            }
            
            public function headings(): array {
                return $this->headings;
            }
        }, 'Laporan_Dana_Masuk.xlsx');
    }

    public function exportLoansExcel(Request $request)
    {
        $query = Loan::with(['asset.unit', 'borrower'])->orderBy('created_at', 'desc');
        
        $user = auth()->user();
        if ($user->isOperator() && $user->unit_id) {
            $query->whereHas('asset', function($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
        } elseif ($request->has('unit_id')) {
            $query->whereHas('asset', function($q) use ($request) {
                $q->where('unit_id', $request->unit_id);
            });
        }

        $loans = $query->get();
        
        $headings = ['ID Peminjaman', 'Tanggal Pinjam', 'Est. Kembali', 'Kembali Aktual', 'Peminjam', 'Email', 'Tipe', 'Aset', 'Kode Barang', 'Unit', 'Jenis BMN', 'Status', 'Kondisi Pinjam', 'Kondisi Kembali', 'Total Biaya', 'Denda'];
        
        $data = $loans->map(function($loan) {
            return [
                'ID Peminjaman' => $loan->id,
                'Tanggal Pinjam' => $loan->borrow_date->format('d-m-Y'),
                'Est. Kembali' => $loan->estimated_return_date->format('d-m-Y'),
                'Kembali Aktual' => $loan->actual_return_date ? $loan->actual_return_date->format('d-m-Y') : '-',
                'Peminjam' => $loan->borrower->name,
                'Email' => $loan->borrower->email,
                'Tipe' => $loan->borrower->is_guest ? 'Tamu' : 'Kampus',
                'Aset' => $loan->asset->nama_barang,
                'Kode Barang' => $loan->asset->kode_barang,
                'Unit' => $loan->asset->unit->name ?? 'Gudang',
                'Jenis BMN' => $loan->asset->jenis_bmn,
                'Status' => $loan->status,
                'Kondisi Pinjam' => $loan->condition_when_borrowed,
                'Kondisi Kembali' => $loan->condition_when_returned ?? '-',
                'Total Biaya' => $loan->total_cost,
                'Denda' => $loan->late_fee,
            ];
        });

        return Excel::download(new class($data, $headings) implements FromCollection, WithHeadings {
            private $data;
            private $headings;
            
            public function __construct($data, $headings) {
                $this->data = $data;
                $this->headings = $headings;
            }
            
            public function collection() {
                return $this->data;
            }
            
            public function headings(): array {
                return $this->headings;
            }
        }, 'Laporan_Peminjaman.xlsx');
    }
}
