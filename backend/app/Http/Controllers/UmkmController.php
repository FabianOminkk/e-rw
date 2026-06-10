<?php

namespace App\Http\Controllers;

use App\Models\UmkmListing;
use Illuminate\Http\Request;

class UmkmController extends Controller
{
    /**
     * List all approved UMKM listings.
     */
    public function index()
    {
        $listings = UmkmListing::with('user:id,name,no_rt,no_rw')
            ->where('status', 'approved')
            ->orderBy('name', 'asc')
            ->get();
        return response()->json($listings);
    }

    /**
     * List all pending listings (Super Admin & Admin).
     */
    public function indexPending()
    {
        $user = auth()->user();
        if (!in_array($user->role, ['super_admin', 'admin'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $listings = UmkmListing::with('user:id,name,no_rt,no_rw')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($listings);
    }

    /**
     * List my listings (Warga).
     */
    public function myListings()
    {
        $listings = UmkmListing::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($listings);
    }

    /**
     * Register a new UMKM listing.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'phone_number' => 'required|string|max:20',
            'description' => 'required|string|max:1000',
        ]);

        // Format phone number to international 62 format for WhatsApp Click-to-Chat
        $phone = $request->phone_number;
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }

        $listing = UmkmListing::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'price' => $request->price,
            'phone_number' => $phone,
            'description' => $request->description,
            'status' => 'pending' // requires RT or Super Admin approval
        ]);

        return response()->json([
            'message' => 'Lapak UMKM berhasil didaftarkan dan sedang menunggu persetujuan.',
            'data' => $listing
        ], 201);
    }

    /**
     * Approve or reject a listing (Super Admin & Admin).
     */
    public function updateStatus(Request $request, UmkmListing $listing)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected'
        ]);

        $user = auth()->user();
        if (!in_array($user->role, ['super_admin', 'admin'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $listing->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Status persetujuan lapak berhasil diperbarui.',
            'data' => $listing
        ]);
    }

    /**
     * Delete a listing.
     */
    public function destroy(UmkmListing $listing)
    {
        $user = auth()->user();

        // Check ownership or admin/super_admin role
        if (!in_array($user->role, ['super_admin', 'admin']) && $listing->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $listing->delete();

        return response()->json(['message' => 'Lapak UMKM berhasil dihapus.']);
    }
}
