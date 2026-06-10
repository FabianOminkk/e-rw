<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssetController extends Controller
{
    /**
     * List all assets.
     */
    public function index()
    {
        return response()->json(Asset::orderBy('name', 'asc')->get());
    }

    /**
     * Create a new asset.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $asset = Asset::create($request->only('name', 'quantity', 'description'));

        return response()->json([
            'message' => 'Aset baru berhasil ditambahkan.',
            'data' => $asset
        ], 201);
    }

    /**
     * Update an asset.
     */
    public function update(Request $request, Asset $asset)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $asset->update($request->only('name', 'quantity', 'description'));

        return response()->json([
            'message' => 'Data aset berhasil diperbarui.',
            'data' => $asset
        ]);
    }

    /**
     * Delete an asset.
     */
    public function destroy(Asset $asset)
    {
        $asset->delete();
        return response()->json(['message' => 'Aset berhasil dihapus.']);
    }

    /**
     * Get all bookings (warga only gets their own).
     */
    public function indexBookings(Request $request)
    {
        $user = auth()->user();
        $query = AssetBooking::with(['user:id,name,no_rt,no_rw,phone', 'asset:id,name']);

        if ($user->role === 'warga') {
            $query->where('user_id', $user->id);
        }

        $bookings = $query->orderBy('created_at', 'desc')->get();
        return response()->json($bookings);
    }

    /**
     * Submit a new booking.
     */
    public function storeBooking(Request $request)
    {
        $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'quantity' => 'required|integer|min:1',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'purpose' => 'required|string|max:500',
        ]);

        $asset = Asset::findOrFail($request->asset_id);
        $requestedQty = $request->quantity;
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Check if there is enough stock for every day in the requested date range
        $overlappingBookings = AssetBooking::where('asset_id', $asset->id)
            ->whereIn('status', ['pending', 'approved'])
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate)
            ->get();

        $start = new \DateTime($startDate);
        $end = new \DateTime($endDate);
        $interval = new \DateInterval('P1D');
        // DatePeriod ignores the end date unless we modify it to include it
        $period = new \DatePeriod($start, $interval, (clone $end)->modify('+1 day'));

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $bookedOnDay = 0;
            foreach ($overlappingBookings as $booking) {
                if ($booking->start_date <= $dateStr && $booking->end_date >= $dateStr) {
                    $bookedOnDay += $booking->quantity;
                }
            }
            if (($bookedOnDay + $requestedQty) > $asset->quantity) {
                return response()->json([
                    'message' => "Stok untuk barang '{$asset->name}' tidak mencukupi pada tanggal {$dateStr}. Stok tersedia: " . max(0, $asset->quantity - $bookedOnDay)
                ], 422);
            }
        }

        $booking = AssetBooking::create([
            'user_id' => auth()->id(),
            'asset_id' => $request->asset_id,
            'quantity' => $requestedQty,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'purpose' => $request->purpose,
            'status' => 'pending'
        ]);

        return response()->json([
            'message' => 'Pengajuan peminjaman aset berhasil dikirim.',
            'data' => $booking->load('asset')
        ], 201);
    }

    /**
     * Update status of a booking (approve/reject/return).
     */
    public function updateBookingStatus(Request $request, AssetBooking $booking)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,returned'
        ]);

        // Access check
        $user = auth()->user();
        if (!in_array($user->role, ['super_admin', 'admin', 'bendahara'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $booking->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Status peminjaman berhasil diperbarui.',
            'data' => $booking->load(['user:id,name', 'asset:id,name'])
        ]);
    }
}
