<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CitizenController extends Controller
{
    /**
     * Display a listing of the citizens.
     */
    public function index()
    {
        $citizens = User::where('role', 'warga')->get();
        return response()->json($citizens);
    }

    /**
     * Store a newly created citizen in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'gender' => 'required|string|in:L,P',
            'birth_date' => 'nullable|date',
            'is_pregnant' => 'nullable|boolean',
            'no_kk' => 'nullable|string|max:30',
            'no_rt' => 'nullable|string|max:10',
            'no_rw' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status_warga' => 'required|string|in:aktif,pendatang,pindah,meninggal',
        ]);

        $citizen = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'warga',
            'gender' => $request->gender,
            'birth_date' => $request->birth_date,
            'is_pregnant' => $request->is_pregnant ? true : false,
            'no_kk' => $request->no_kk,
            'no_rt' => $request->no_rt,
            'no_rw' => $request->no_rw,
            'phone' => $request->phone,
            'address' => $request->address,
            'status_warga' => $request->status_warga,
        ]);

        return response()->json([
            'message' => 'Data warga berhasil ditambahkan.',
            'data' => $citizen,
        ], 201);
    }

    /**
     * Display the specified citizen.
     */
    public function show(User $citizen)
    {
        if ($citizen->role !== 'warga') {
            return response()->json(['message' => 'Pengguna bukan warga.'], 404);
        }

        return response()->json($citizen);
    }

    /**
     * Update the specified citizen in storage.
     */
    public function update(Request $request, User $citizen)
    {
        if ($citizen->role !== 'warga') {
            return response()->json(['message' => 'Pengguna bukan warga.'], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $citizen->id,
            'password' => 'nullable|string|min:6',
            'gender' => 'required|string|in:L,P',
            'birth_date' => 'nullable|date',
            'is_pregnant' => 'nullable|boolean',
            'no_kk' => 'nullable|string|max:30',
            'no_rt' => 'nullable|string|max:10',
            'no_rw' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status_warga' => 'required|string|in:aktif,pendatang,pindah,meninggal',
        ]);

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'gender' => $request->gender,
            'birth_date' => $request->birth_date,
            'is_pregnant' => $request->is_pregnant ? true : false,
            'no_kk' => $request->no_kk,
            'no_rt' => $request->no_rt,
            'no_rw' => $request->no_rw,
            'phone' => $request->phone,
            'address' => $request->address,
            'status_warga' => $request->status_warga,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $citizen->update($data);

        return response()->json([
            'message' => 'Data warga berhasil diperbarui.',
            'data' => $citizen,
        ]);
    }

    /**
     * Remove the specified citizen from storage.
     */
    public function destroy(User $citizen)
    {
        if ($citizen->role !== 'warga') {
            return response()->json(['message' => 'Pengguna bukan warga.'], 404);
        }

        $citizen->delete();

        return response()->json([
            'message' => 'Data warga berhasil dihapus.',
        ]);
    }
}
