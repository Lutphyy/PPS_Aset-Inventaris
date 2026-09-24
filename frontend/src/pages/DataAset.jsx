import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react'

function DataAset() {
  const assets = [
    {
      kode: 'AST001',
      nama: 'Laptop Dell Latitude 5420',
      kategori: 'Elektronik',
      lokasi: 'Fakultas Teknik dan Kemaritiman',
      kondisi: 'Baik',
      status: 'Tersedia',
    },
    {
      kode: 'AST002',
      nama: 'Proyektor BenQ MX550',
      kategori: 'Elektronik',
      lokasi: 'Fakultas Teknik dan Kemaritiman',
      kondisi: 'Baik',
      status: 'Dipinjam',
    },
    {
      kode: 'AST003',
      nama: 'Bus Kampus Isuzu Elf',
      kategori: 'Kendaraan',
      lokasi: 'Bagian Umum',
      kondisi: 'Baik',
      status: 'Tersedia',
    },
    {
      kode: 'AST004',
      nama: 'Osiloskop Digital Tektronix',
      kategori: 'Elektronik',
      lokasi: 'Fakultas Kelautan dan Ilmu Perikanan',
      kondisi: 'Baik',
      status: 'Tersedia',
    },
    {
      kode: 'AST005',
      nama: 'Meja Kerja Staff',
      kategori: 'Furniture',
      lokasi: 'Rektorat',
      kondisi: 'Rusak Ringan',
      status: 'Perbaikan',
    },
    {
      kode: 'AST006',
      nama: 'Kursi Kerja Ergonomis',
      kategori: 'Furniture',
      lokasi: 'Perpustakaan',
      kondisi: 'Baik',
      status: 'Tersedia',
    },
  ]

  return (
    <div className="asset-page">

      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="asset-page-header">

        <div>
          <h1>Data Aset</h1>

          <p>
            Kelola seluruh aset dan inventaris universitas
          </p>
        </div>

        <button
          type="button"
          className="add-asset-button"
        >
          <Plus
            size={17}
            strokeWidth={2}
          />

          <span>
            Tambah Aset
          </span>
        </button>

      </div>


      {/* =========================================
          FILTER SECTION
      ========================================= */}

      <div className="asset-filter-card">

        {/* SEARCH */}

        <div className="asset-search">

          <Search
            size={16}
            strokeWidth={1.8}
          />

          <input
            type="text"
            placeholder="Cari nama atau kode aset..."
          />

        </div>


        {/* KATEGORI */}

        <div className="asset-filter">

          <select defaultValue="">
            <option value="">
              Semua Kategori
            </option>

            <option>
              Elektronik
            </option>

            <option>
              Furniture
            </option>

            <option>
              Kendaraan
            </option>

            <option>
              Lainnya
            </option>
          </select>

        </div>


        {/* LOKASI */}

        <div className="asset-filter">

          <select defaultValue="">
            <option value="">
              Semua Lokasi
            </option>

            <option>
              Fakultas Teknik dan Kemaritiman
            </option>

            <option>
              Fakultas Ekonomi dan Bisnis Maritim
            </option>

            <option>
              Fakultas Ilmu Sosial dan Ilmu Politik
            </option>

            <option>
              Fakultas Kelautan dan Ilmu Perikanan
            </option>

            <option>
              Fakultas Ilmu Keguruan dan Pendidikan
            </option>

            <option>
              Fakultas Kedokteran
            </option>

            <option>
              Rektorat
            </option>

            <option>
              Perpustakaan
            </option>

            <option>
              Bagian Umum
            </option>

          </select>

        </div>


        {/* KONDISI */}

        <div className="asset-filter">

          <select defaultValue="">
            <option value="">
              Semua Kondisi
            </option>

            <option>
              Baik
            </option>

            <option>
              Rusak Ringan
            </option>

            <option>
              Rusak Berat
            </option>

          </select>

        </div>


        {/* STATUS */}

        <div className="asset-filter">

          <select defaultValue="">
            <option value="">
              Semua Status
            </option>

            <option>
              Tersedia
            </option>

            <option>
              Dipinjam
            </option>

            <option>
              Perbaikan
            </option>

            <option>
              Rusak
            </option>

            <option>
              Dihapuskan
            </option>

          </select>

        </div>

      </div>


      {/* =========================================
          TABLE CARD
      ========================================= */}

      <div className="asset-table-card">

        {/* TABLE HEADER */}

        <div className="asset-table-header">

          <div>

            <h3>
              Daftar Aset
            </h3>

            <p>
              Menampilkan seluruh aset yang terdaftar
            </p>

          </div>

          <span className="asset-total">
            {assets.length} Aset
          </span>

        </div>


        {/* =========================================
            TABLE
        ========================================= */}

        <div className="asset-table-wrapper">

          <table className="asset-table">

            <thead>

              <tr>

                <th>
                  Kode
                </th>

                <th>
                  Nama Aset
                </th>

                <th>
                  Kategori
                </th>

                <th>
                  Unit / Lokasi
                </th>

                <th>
                  Kondisi
                </th>

                <th>
                  Status
                </th>

                <th>
                  Aksi
                </th>

              </tr>

            </thead>


            <tbody>

              {assets.map((asset) => (

                <tr key={asset.kode}>

                  {/* KODE */}

                  <td>

                    <span className="asset-code">
                      {asset.kode}
                    </span>

                  </td>


                  {/* NAMA */}

                  <td>

                    <span className="asset-name">
                      {asset.nama}
                    </span>

                  </td>


                  {/* KATEGORI */}

                  <td>
                    {asset.kategori}
                  </td>


                  {/* LOKASI */}

                  <td>

                    <span className="asset-location">
                      {asset.lokasi}
                    </span>

                  </td>


                  {/* KONDISI */}

                  <td>

                    <span
                      className={`condition-badge ${
                        asset.kondisi
                          .toLowerCase()
                          .replace(' ', '-')
                      }`}
                    >
                      {asset.kondisi}
                    </span>

                  </td>


                  {/* STATUS */}

                  <td>

                    <span
                      className={`asset-status ${
                        asset.status
                          .toLowerCase()
                          .replace(' ', '-')
                      }`}
                    >
                      {asset.status}
                    </span>

                  </td>


                  {/* AKSI */}

                  <td>

                    <div className="asset-actions">

                      <button
                        type="button"
                        title="Lihat"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        className="delete"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>


      {/* =========================================
          ASISTEN ASET
      ========================================= */}

      <button
        type="button"
        className="asset-assistant-button"
      >
        <Sparkles
          size={22}
          strokeWidth={2}
        />

        <span>
          Asisten Aset
        </span>

      </button>

    </div>
  )
}

export default DataAset