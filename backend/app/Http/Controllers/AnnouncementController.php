<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of announcements.
     */
    public function index()
    {
        $announcements = Announcement::with('author:id,name,role')->orderBy('created_at', 'desc')->get();
        return response()->json($announcements);
    }

    /**
     * Store a newly created announcement.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $announcement = Announcement::create([
            'title' => $request->title,
            'content' => $request->content,
            'author_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Pengumuman berhasil diterbitkan.',
            'data' => $announcement->load('author:id,name,role')
        ], 201);
    }

    /**
     * Update the specified announcement.
     */
    public function update(Request $request, Announcement $announcement)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $announcement->update([
            'title' => $request->title,
            'content' => $request->content,
        ]);

        return response()->json([
            'message' => 'Pengumuman berhasil diperbarui.',
            'data' => $announcement->load('author:id,name,role')
        ]);
    }

    /**
     * Remove the specified announcement.
     */
    public function destroy(Announcement $announcement)
    {
        $announcement->delete();

        return response()->json([
            'message' => 'Pengumuman berhasil dihapus.'
        ]);
    }
}
