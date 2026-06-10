<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CitizenController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\LetterController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\UmkmController;
use App\Http\Controllers\RondaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// 1. Public Routes
Route::post('/login', [AuthController::class, 'login']);

// 2. Protected Routes (Must be Authenticated)
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth-related
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Announcements (All roles can view)
    Route::get('/announcements', [AnnouncementController::class, 'index']);

    // Complaints / Pengaduan
    Route::get('/complaints', [ComplaintController::class, 'index']);
    Route::post('/complaints', [ComplaintController::class, 'store']); // Warga submits complaint

    // Letter Requests / Surat Pengantar
    Route::get('/letters', [LetterController::class, 'index']);
    Route::post('/letters', [LetterController::class, 'store']); // Warga requests letter

    // Bills / Iuran (All roles can view bills, warga only views theirs)
    Route::get('/bills', [FinanceController::class, 'indexBills']);

    // --- Role-Based Access Control ---

    // A. Admin & Super Admin Routes
    Route::middleware('role:admin,super_admin')->group(function () {
        // Citizens CRUD (Warga Management)
        Route::apiResource('citizens', CitizenController::class);
        
        // Write Announcements
        Route::post('/announcements', [AnnouncementController::class, 'store']);
        Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update']);
        Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);

        // Approve/Reject Letter Requests
        Route::put('/letters/{letter}/status', [LetterController::class, 'updateStatus']);

        // Reply to Citizen Complaints
        Route::put('/complaints/{complaint}/reply', [ComplaintController::class, 'reply']);
    });

    // B. Bendahara, Admin & Super Admin (View Cash / Kas)
    Route::middleware('role:bendahara,admin,super_admin')->group(function () {
        Route::get('/finances', [FinanceController::class, 'index']);
    });

    // C. Bendahara Only Routes (Manage Cash and Record Payments)
    Route::middleware('role:bendahara')->group(function () {
        Route::post('/finances', [FinanceController::class, 'storeTransaction']); // Create income/expense transaction
        Route::post('/bills', [FinanceController::class, 'storeBill']); // Create monthly iuran bills
    });

    // Pay monthly bills (Accessible by Bendahara, Warga, and Super Admin)
    Route::middleware('role:bendahara,warga,super_admin')->group(function () {
        Route::put('/bills/{bill}/pay', [FinanceController::class, 'payBill']); // Pay a monthly bill
        Route::post('/bills/pay-custom', [FinanceController::class, 'payCustomBill']); // Pay custom monthly bill
    });

    // --- New Features (Aset, UMKM, Ronda) ---
    
    // 1. Assets / Inventaris
    Route::get('/assets', [AssetController::class, 'index']);
    Route::get('/assets/bookings', [AssetController::class, 'indexBookings']);
    Route::post('/assets/bookings', [AssetController::class, 'storeBooking']);
    Route::middleware('role:bendahara,super_admin')->group(function () {
        Route::post('/assets', [AssetController::class, 'store']);
        Route::put('/assets/{asset}', [AssetController::class, 'update']);
        Route::delete('/assets/{asset}', [AssetController::class, 'destroy']);
    });
    Route::middleware('role:bendahara,admin,super_admin')->group(function () {
        Route::put('/assets/bookings/{booking}/status', [AssetController::class, 'updateBookingStatus']);
    });

    // 2. UMKM / Katalog Usaha Warga
    Route::get('/umkm', [UmkmController::class, 'index']);
    Route::get('/umkm/my-listings', [UmkmController::class, 'myListings']);
    Route::post('/umkm', [UmkmController::class, 'store']);
    Route::delete('/umkm/{listing}', [UmkmController::class, 'destroy']);
    Route::middleware('role:admin,super_admin')->group(function () {
        Route::get('/umkm/pending', [UmkmController::class, 'indexPending']);
        Route::put('/umkm/{listing}/status', [UmkmController::class, 'updateStatus']);
    });

    // 3. Ronda / Keamanan Malam
    Route::get('/ronda', [RondaController::class, 'index']);
    Route::middleware('role:admin,super_admin')->group(function () {
        Route::post('/ronda', [RondaController::class, 'store']);
        Route::delete('/ronda/{ronda}', [RondaController::class, 'destroy']);
    });

});
