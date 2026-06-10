<?php

namespace App\Http\Controllers;

use App\Models\RondaSchedule;
use Illuminate\Http\Request;

class RondaController extends Controller
{
    /**
     * Get ronda schedules.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = RondaSchedule::query();

        // If Warga, filter by their RT by default, but allow query override
        if ($user->role === 'warga') {
            $rt = $request->input('no_rt', $user->no_rt);
            $query->where('no_rt', $rt);
        } elseif ($request->has('no_rt')) {
            $query->where('no_rt', $request->no_rt);
        }

        $schedules = $query->get();

        // Sort by Indonesian day of the week order
        $dayOrder = [
            'Senin' => 1,
            'Selasa' => 2,
            'Rabu' => 3,
            'Kamis' => 4,
            'Jumat' => 5,
            'Sabtu' => 6,
            'Minggu' => 7
        ];

        $sorted = $schedules->sortBy(function ($item) use ($dayOrder) {
            return $dayOrder[$item->day_of_week] ?? 8;
        })->values();

        return response()->json($sorted);
    }

    /**
     * Create or update a schedule (Super Admin & Admin).
     */
    public function store(Request $request)
    {
        $request->validate([
            'day_of_week' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'no_rt' => 'required|string',
            'warga_names' => 'required|string|max:500',
        ]);

        $user = auth()->user();

        // Check if admin is trying to manage schedules for another RT
        if ($user->role === 'admin' && $request->no_rt !== $user->no_rt) {
            return response()->json(['message' => 'Anda hanya dapat mengelola jadwal ronda untuk RT Anda sendiri.'], 403);
        }

        if (!in_array($user->role, ['super_admin', 'admin'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Upsert ronda schedule
        $schedule = RondaSchedule::updateOrCreate(
            [
                'day_of_week' => $request->day_of_week,
                'no_rt' => $request->no_rt
            ],
            [
                'warga_names' => $request->warga_names
            ]
        );

        return response()->json([
            'message' => 'Jadwal ronda berhasil disimpan.',
            'data' => $schedule
        ]);
    }

    /**
     * Delete a schedule.
     */
    public function destroy(RondaSchedule $ronda)
    {
        $user = auth()->user();

        if (!in_array($user->role, ['super_admin', 'admin'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Check if admin is trying to delete schedules for another RT
        if ($user->role === 'admin' && $ronda->no_rt !== $user->no_rt) {
            return response()->json(['message' => 'Anda hanya dapat menghapus jadwal ronda untuk RT Anda sendiri.'], 403);
        }

        $ronda->delete();

        return response()->json(['message' => 'Jadwal ronda berhasil dihapus.']);
    }
}
