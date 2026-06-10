<?php

namespace App\Http\Controllers;

use App\Models\LetterRequest;
use Illuminate\Http\Request;

class LetterController extends Controller
{
    /**
     * Display a listing of letter requests.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (in_array($user->role, ['super_admin', 'admin'])) {
            // Admin can view all requests
            $letters = LetterRequest::with('user:id,name,email,no_rt,no_rw,no_kk')->orderBy('created_at', 'desc')->get();
        } else {
            // Citizen can only view their own requests
            $letters = LetterRequest::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        }

        return response()->json($letters);
    }

    /**
     * Store a newly created letter request.
     */
    public function store(Request $request)
    {
        $request->validate([
            'letter_type' => 'required|string|max:255',
            'purpose' => 'required|string',
        ]);

        $letter = LetterRequest::create([
            'user_id' => $request->user()->id,
            'letter_type' => $request->letter_type,
            'purpose' => $request->purpose,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Permohonan surat pengantar berhasil diajukan.',
            'data' => $letter
        ], 201);
    }

    /**
     * Update the status of a letter request (Approve/Reject).
     */
    public function updateStatus(Request $request, LetterRequest $letter)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,pending',
            'notes' => 'nullable|string',
        ]);

        $letter->update([
            'status' => $request->status,
            'notes' => $request->notes,
        ]);

        return response()->json([
            'message' => 'Status surat pengantar berhasil diperbarui.',
            'data' => $letter->load('user:id,name,email')
        ]);
    }
}
