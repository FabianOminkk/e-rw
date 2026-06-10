<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    /**
     * Display a listing of complaints.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (in_array($user->role, ['super_admin', 'admin'])) {
            $complaints = Complaint::with('user:id,name,email,no_rt,no_rw')->orderBy('created_at', 'desc')->get();
        } else {
            $complaints = Complaint::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        }

        return response()->json($complaints);
    }

    /**
     * Store a newly created complaint.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $complaint = Complaint::create([
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'content' => $request->content,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Laporan pengaduan berhasil dikirim.',
            'data' => $complaint
        ], 201);
    }

    /**
     * Admin replies to complaint and updates status.
     */
    public function reply(Request $request, Complaint $complaint)
    {
        $request->validate([
            'status' => 'required|in:pending,processed,resolved',
            'reply' => 'required|string',
        ]);

        $complaint->update([
            'status' => $request->status,
            'reply' => $request->reply,
        ]);

        return response()->json([
            'message' => 'Aduan warga berhasil ditanggapi.',
            'data' => $complaint->load('user:id,name,email')
        ]);
    }
}
