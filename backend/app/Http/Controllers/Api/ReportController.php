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

class ReportController extends Controller
{
    public function exportAssetsExcel()
    {
        $assets = Asset::with('createdBy')->orderBy('code')->get();
        
        $data = $assets->map(function($asset) {
            return [
                'Kode' => $asset->code,
                'Nama Aset' => $asset->name,
                'Kategori' => $asset->category,
                'Unit' => $asset->unit,
                'Lokasi' => $asset->location,
                'Lantai' => $asset->floor ?? '-',
                'Tahun Perolehan' => $asset->purchase_year ?? '-',
                'Harga Beli' => $asset->purchase_price ?? 0,
                'Biaya Sewa/Hari' => $asset->rental_price_per_day,
                'Kondisi' => $asset->condition,
                'Status' => $asset->status,
                'Dibuat Oleh' => $asset->createdBy->name ?? '-',
                'Tanggal Dibuat' => $asset->created_at->format('d-m-Y'),
            ];
        });

        return Excel::download(new class($data) implements FromCollection, WithHeadings {
            private $data;
            
            public function __construct($data) {
                $this->data = $data;
            }
            
            public function collection() {
                return $this->data;
            }
            
            public function headings(): array {
                return array_keys($this->data->first());
            }
        }, 'Laporan_Aset.xlsx');
    }

    public function exportAssetsByConditionExcel()
    {
        $conditions = ['BAIK', 'CUKUP', 'KURANG', 'RUSAK_RINGAN', 'RUSAK_BERAT'];
        
        return Excel::download(new class($conditions) implements WithMultipleSheets {
            private $conditions;
            
            public function __construct($conditions) {
                $this->conditions = $conditions;
            }
            
            public function sheets(): array {
                $sheets = [];
                
                foreach ($this->conditions as $condition) {
                    $assets = Asset::where('condition', $condition)->orderBy('code')->get();
                    
                    $data = $assets->map(function($asset) {
                        return [
                            'Kode' => $asset->code,
                            'Nama Aset' => $asset->name,
                            'Kategori' => $asset->category,
                            'Unit' => $asset->unit,
                            'Lokasi' => $asset->location,
                            'Status' => $asset->status,
                            'Biaya Sewa/Hari' => $asset->rental_price_per_day,
                        ];
                    });
                    
                    $sheets[] = new class($data, $condition) implements FromCollection, WithHeadings {
                        private $data;
                        private $title;
                        
                        public function __construct($data, $title) {
                            $this->data = $data;
                            $this->title = $title;
                        }
                        
                        public function collection() {
                            return $this->data;
                        }
                        
                        public function headings(): array {
                            return ['Kode', 'Nama Aset', 'Kategori', 'Unit', 'Lokasi', 'Status', 'Biaya Sewa/Hari'];
                        }
                        
                        public function title(): string {
                            return $this->title;
                        }
                    };
                }
                
                return $sheets;
            }
        }, 'Laporan_Aset_Per_Kondisi.xlsx');
    }

    public function exportRevenueExcel()
    {
        $payments = Payment::with(['loan.asset', 'loan.borrower'])
            ->where('status', 'LUNAS')
            ->orderBy('paid_at', 'desc')
            ->get();
        
        $data = $payments->map(function($payment) {
            return [
                'Tanggal Bayar' => $payment->paid_at ? $payment->paid_at->format('d-m-Y') : '-',
                'Peminjam' => $payment->loan->borrower->name,
                'Tipe' => $payment->loan->borrower->is_guest ? 'Tamu' : 'Kampus',
                'Unit' => $payment->loan->borrower->unit ?? '-',
                'Aset' => $payment->loan->asset->name,
                'Kode Aset' => $payment->loan->asset->code,
                'Total Hari' => $payment->loan->total_days,
                'Biaya Sewa' => $payment->loan->total_rental_cost,
                'Diskon (%)' => $payment->loan->discount_percent,
                'Diskon (Rp)' => $payment->loan->discount_amount,
                'Denda Terlambat' => $payment->loan->late_fee,
                'Total Bayar' => $payment->amount,
                'Metode' => $payment->payment_method ?? '-',
            ];
        });

        return Excel::download(new class($data) implements FromCollection, WithHeadings {
            private $data;
            
            public function __construct($data) {
                $this->data = $data;
            }
            
            public function collection() {
                return $this->data;
            }
            
            public function headings(): array {
                return array_keys($this->data->first());
            }
        }, 'Laporan_Dana_Masuk.xlsx');
    }

    public function exportLoansExcel()
    {
        $loans = Loan::with(['asset', 'borrower'])->orderBy('created_at', 'desc')->get();
        
        $data = $loans->map(function($loan) {
            return [
                'ID Peminjaman' => $loan->id,
                'Tanggal Pinjam' => $loan->borrow_date->format('d-m-Y'),
                'Est. Kembali' => $loan->estimated_return_date->format('d-m-Y'),
                'Kembali Aktual' => $loan->actual_return_date ? $loan->actual_return_date->format('d-m-Y') : '-',
                'Peminjam' => $loan->borrower->name,
                'Email' => $loan->borrower->email,
                'Tipe' => $loan->borrower->is_guest ? 'Tamu' : 'Kampus',
                'Aset' => $loan->asset->name,
                'Kode Aset' => $loan->asset->code,
                'Kategori' => $loan->asset->category,
                'Status' => $loan->status,
                'Kondisi Pinjam' => $loan->condition_when_borrowed,
                'Kondisi Kembali' => $loan->condition_when_returned ?? '-',
                'Total Biaya' => $loan->total_cost,
                'Denda' => $loan->late_fee,
            ];
        });

        return Excel::download(new class($data) implements FromCollection, WithHeadings {
            private $data;
            
            public function __construct($data) {
                $this->data = $data;
            }
            
            public function collection() {
                return $this->data;
            }
            
            public function headings(): array {
                return array_keys($this->data->first());
            }
        }, 'Laporan_Peminjaman.xlsx');
    }
}
