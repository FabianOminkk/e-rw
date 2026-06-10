<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Bill;
use App\Models\Finance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class BillPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_warga_can_pay_existing_unpaid_bill_with_custom_amount(): void
    {
        // 1. Create a warga user
        $warga = User::create([
            'name' => 'Warga Test',
            'email' => 'wargatest@erw.com',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'no_kk' => '1234567890123456',
            'no_rt' => '01',
            'no_rw' => '02',
            'phone' => '081234567890',
            'address' => 'Jl. Test No. 1',
            'status_warga' => 'aktif',
        ]);

        // 2. Create an unpaid bill for this warga
        $bill = Bill::create([
            'user_id' => $warga->id,
            'month' => '2026-05',
            'amount' => 50000,
            'status' => 'unpaid',
        ]);

        // 3. Authenticate as warga
        Sanctum::actingAs($warga);

        // 4. Send payment request
        $response = $this->postJson('/api/bills/pay-custom', [
            'month' => '2026-05',
            'amount' => 60000,
        ]);

        // 5. Assertions
        $response->assertStatus(200);
        
        // Assert bill updated
        $this->assertDatabaseHas('bills', [
            'id' => $bill->id,
            'status' => 'paid',
            'amount' => 60000,
            'payment_date' => now()->format('Y-m-d'),
        ]);

        // Assert finance record created
        $this->assertDatabaseHas('finances', [
            'type' => 'income',
            'amount' => 60000,
            'description' => 'Iuran bulanan 2026-05 - Warga Test',
        ]);
    }

    public function test_warga_can_pay_non_existent_future_bill_creating_a_new_record(): void
    {
        // 1. Create a warga user
        $warga = User::create([
            'name' => 'Warga Test',
            'email' => 'wargatest@erw.com',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'no_kk' => '1234567890123456',
            'no_rt' => '01',
            'no_rw' => '02',
            'phone' => '081234567890',
            'address' => 'Jl. Test No. 1',
            'status_warga' => 'aktif',
        ]);

        // 2. Authenticate as warga
        Sanctum::actingAs($warga);

        // 3. Send payment request for month with no bill
        $response = $this->postJson('/api/bills/pay-custom', [
            'month' => '2026-07',
            'amount' => 75000,
        ]);

        // 4. Assertions
        $response->assertStatus(200);

        // Assert bill created
        $this->assertDatabaseHas('bills', [
            'user_id' => $warga->id,
            'month' => '2026-07',
            'status' => 'paid',
            'amount' => 75000,
            'payment_date' => now()->format('Y-m-d'),
        ]);

        // Assert finance record created
        $this->assertDatabaseHas('finances', [
            'type' => 'income',
            'amount' => 75000,
            'description' => 'Iuran bulanan 2026-07 - Warga Test',
        ]);
    }

    public function test_warga_cannot_pay_already_paid_bill(): void
    {
        // 1. Create a warga user
        $warga = User::create([
            'name' => 'Warga Test',
            'email' => 'wargatest@erw.com',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'no_kk' => '1234567890123456',
            'no_rt' => '01',
            'no_rw' => '02',
            'phone' => '081234567890',
            'address' => 'Jl. Test No. 1',
            'status_warga' => 'aktif',
        ]);

        // 2. Create a paid bill for this warga
        $bill = Bill::create([
            'user_id' => $warga->id,
            'month' => '2026-06',
            'amount' => 50000,
            'status' => 'paid',
            'payment_date' => '2026-06-01',
        ]);

        // 3. Authenticate as warga
        Sanctum::actingAs($warga);

        // 4. Send payment request
        $response = $this->postJson('/api/bills/pay-custom', [
            'month' => '2026-06',
            'amount' => 50000,
        ]);

        // 5. Assertions
        $response->assertStatus(422);
    }
}
