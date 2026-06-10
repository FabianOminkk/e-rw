<?php

namespace App\Http\Controllers;

use App\Models\Finance;
use App\Models\Bill;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    /**
     * Get summary of RW cash and list transactions.
     */
    public function index()
    {
        $transactions = Finance::orderBy('date', 'desc')->get();
        
        $totalIncome = Finance::where('type', 'income')->sum('amount');
        $totalExpense = Finance::where('type', 'expense')->sum('amount');
        $balance = $totalIncome - $totalExpense;

        return response()->json([
            'summary' => [
                'total_income' => $totalIncome,
                'total_expense' => $totalExpense,
                'balance' => $balance
            ],
            'transactions' => $transactions
        ]);
    }

    /**
     * Add new cash transaction (Income/Expense).
     */
    public function storeTransaction(Request $request)
    {
        $request->validate([
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string|max:255',
            'date' => 'required|date',
        ]);

        $transaction = Finance::create($request->only('type', 'amount', 'description', 'date'));

        return response()->json([
            'message' => 'Transaksi kas berhasil dicatat.',
            'data' => $transaction
        ], 201);
    }

    /**
     * Get all bills.
     */
    public function indexBills(Request $request)
    {
        $query = Bill::with('user:id,name,email,no_rt,no_rw');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $bills = $query->orderBy('month', 'desc')->get();

        return response()->json($bills);
    }

    /**
     * Create a new monthly bill for a citizen or all citizens.
     */
    public function storeBill(Request $request)
    {
        $request->validate([
            'user_id' => 'nullable|exists:users,id', // null means all citizens
            'month' => 'required|string|regex:/^\d{4}-\d{2}$/', // YYYY-MM
            'amount' => 'required|numeric|min:1',
        ]);

        $created = [];

        if ($request->filled('user_id')) {
            $exists = Bill::where('user_id', $request->user_id)
                ->where('month', $request->month)
                ->exists();

            if ($exists) {
                return response()->json(['message' => 'Tagihan bulan ini sudah ada untuk warga ini.'], 422);
            }

            $bill = Bill::create([
                'user_id' => $request->user_id,
                'month' => $request->month,
                'amount' => $request->amount,
                'status' => 'unpaid',
            ]);
            $created[] = $bill;
        } else {
            // Generate bills for all citizens
            $citizens = User::where('role', 'warga')->get();
            
            foreach ($citizens as $citizen) {
                $exists = Bill::where('user_id', $citizen->id)
                    ->where('month', $request->month)
                    ->exists();

                if (!$exists) {
                    $bill = Bill::create([
                        'user_id' => $citizen->id,
                        'month' => $request->month,
                        'amount' => $request->amount,
                        'status' => 'unpaid',
                    ]);
                    $created[] = $bill;
                }
            }
        }

        return response()->json([
            'message' => 'Tagihan iuran bulanan berhasil dibuat.',
            'count' => count($created),
            'data' => $created
        ], 201);
    }

    /**
     * Pay a monthly bill.
     */
    public function payBill(Bill $bill)
    {
        if ($bill->status === 'paid') {
            return response()->json(['message' => 'Tagihan ini sudah lunas.'], 420);
        }

        DB::transaction(function () use ($bill) {
            // 1. Update bill status
            $bill->update([
                'status' => 'paid',
                'payment_date' => now()->format('Y-m-d')
            ]);

            // 2. Add to Kas RW (Finance)
            $citizenName = $bill->user ? $bill->user->name : 'Warga';
            Finance::create([
                'type' => 'income',
                'amount' => $bill->amount,
                'description' => "Iuran bulanan {$bill->month} - {$citizenName}",
                'date' => now()->format('Y-m-d')
            ]);
        });

        return response()->json([
            'message' => 'Pembayaran iuran berhasil dicatat.',
            'data' => $bill->load('user:id,name,email')
        ]);
    }
}
