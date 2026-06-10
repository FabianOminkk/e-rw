<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Announcement;
use App\Models\Complaint;
use App\Models\LetterRequest;
use App\Models\Finance;
use App\Models\Bill;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Core Users
        $superAdmin = User::create([
            'name' => 'Super Admin e-RW',
            'email' => 'superadmin@erw.com',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'gender' => 'L',
            'phone' => '081122334455',
        ]);

        $admin = User::create([
            'name' => 'Ketua RT 03',
            'email' => 'admin@erw.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'gender' => 'L',
            'no_rt' => '003',
            'no_rw' => '012',
            'phone' => '081234567890',
        ]);

        $bendahara = User::create([
            'name' => 'Bendahara RW 12',
            'email' => 'bendahara@erw.com',
            'password' => Hash::make('password'),
            'role' => 'bendahara',
            'gender' => 'P',
            'no_rt' => '003',
            'no_rw' => '012',
            'phone' => '087788990011',
        ]);

        $warga = User::create([
            'name' => 'Budi Santoso (Warga)',
            'email' => 'warga@erw.com',
            'password' => Hash::make('password'),
            'role' => 'warga',
            'gender' => 'L',
            'no_kk' => '3201010101010001',
            'no_rt' => '003',
            'no_rw' => '012',
            'phone' => '089900112233',
            'address' => 'Jl. Merdeka No. 10, RT 03 / RW 12',
            'status_warga' => 'aktif',
        ]);

        // 2. Create Announcements
        Announcement::create([
            'title' => 'Kerja Bakti Kebersihan RW 12',
            'content' => 'Diberitahukan kepada seluruh warga RW 12 bahwa kerja bakti rutin akan diadakan pada hari Minggu besok mulai pukul 07:00 WIB. Harap membawa peralatan kebersihan masing-masing. Terima kasih atas partisipasinya.',
            'author_id' => $admin->id,
        ]);

        Announcement::create([
            'title' => 'Pemberitahuan Pembayaran Iuran Bulanan',
            'content' => 'Batas akhir pembayaran iuran bulanan warga (keamanan & kebersihan) untuk bulan Juni adalah tanggal 15 Juni 2026. Pembayaran dapat diserahkan ke Bendahara RW atau melalui aplikasi ini.',
            'author_id' => $bendahara->id,
        ]);

        // 3. Create Complaints
        Complaint::create([
            'user_id' => $warga->id,
            'title' => 'Lampu Jalan RT 03 Padam',
            'content' => 'Lampu jalan utama di dekat gapura RT 03 sudah padam selama 3 hari. Kondisi jalan cukup gelap saat malam hari. Mohon segera diperbaiki untuk keamanan lingkungan.',
            'status' => 'pending',
        ]);

        Complaint::create([
            'user_id' => $warga->id,
            'title' => 'Tumpukan Sampah Belum Diangkut',
            'content' => 'Bak sampah di depan rumah no. 12 sudah menumpuk sejak 2 hari yang lalu dan mulai berbau kurang sedap. Biasanya diangkut setiap hari.',
            'status' => 'resolved',
            'reply' => 'Petugas kebersihan sudah dikonfirmasi, tumpukan sampah telah diangkut pada siang ini. Terjadi keterlambatan armada sebelumnya.',
        ]);

        // 4. Create Letter Requests
        LetterRequest::create([
            'user_id' => $warga->id,
            'letter_type' => 'Surat Pengantar Pembuatan KTP Baru',
            'purpose' => 'Untuk mengganti KTP yang rusak / patah.',
            'status' => 'pending',
        ]);

        LetterRequest::create([
            'user_id' => $warga->id,
            'letter_type' => 'Surat Pengantar Domisili',
            'purpose' => 'Untuk melengkapi berkas syarat pendaftaran sekolah anak.',
            'status' => 'approved',
            'notes' => 'Surat pengantar nomor 45/RW.12/06/2026 telah ditandatangani dan dapat diambil di rumah RT.',
        ]);

        // 5. Create Finances (Kas RW)
        Finance::create([
            'type' => 'income',
            'amount' => 1500000.00,
            'description' => 'Saldo awal kas kas bulanan RW',
            'date' => '2026-05-01',
        ]);

        Finance::create([
            'type' => 'expense',
            'amount' => 350000.00,
            'description' => 'Pembelian sapu lidah, gerobak sampah, dan alat kebersihan RW',
            'date' => '2026-05-10',
        ]);

        Finance::create([
            'type' => 'income',
            'amount' => 500000.00,
            'description' => 'Donasi warga untuk kegiatan sosial',
            'date' => '2026-05-20',
        ]);

        // 6. Create Bills (Iuran Warga)
        Bill::create([
            'user_id' => $warga->id,
            'month' => '2026-05',
            'amount' => 50000.00,
            'status' => 'paid',
            'payment_date' => '2026-05-05',
        ]);

        Bill::create([
            'user_id' => $warga->id,
            'month' => '2026-06',
            'amount' => 50000.00,
            'status' => 'unpaid',
        ]);
    }
}
