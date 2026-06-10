<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Asset;
use App\Models\AssetBooking;
use App\Models\UmkmListing;
use App\Models\RondaSchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class NewFeaturesTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $adminRt1;
    private User $adminRt2;
    private User $bendahara;
    private User $wargaRt1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@erw.com',
            'password' => bcrypt('password'),
            'role' => 'super_admin',
            'no_kk' => '1111111111111111',
            'no_rt' => '00',
            'no_rw' => '12',
            'phone' => '081234567890',
            'address' => 'RW office',
            'status_warga' => 'aktif',
        ]);

        $this->adminRt1 = User::create([
            'name' => 'Admin RT 01',
            'email' => 'adminrt1@erw.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'no_kk' => '2222222222222222',
            'no_rt' => '01',
            'no_rw' => '12',
            'phone' => '081234567891',
            'address' => 'RT 01 Street',
            'status_warga' => 'aktif',
        ]);

        $this->adminRt2 = User::create([
            'name' => 'Admin RT 02',
            'email' => 'adminrt2@erw.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'no_kk' => '2222222222222223',
            'no_rt' => '02',
            'no_rw' => '12',
            'phone' => '081234567892',
            'address' => 'RT 02 Street',
            'status_warga' => 'aktif',
        ]);

        $this->bendahara = User::create([
            'name' => 'Bendahara',
            'email' => 'bendahara@erw.com',
            'password' => bcrypt('password'),
            'role' => 'bendahara',
            'no_kk' => '3333333333333333',
            'no_rt' => '01',
            'no_rw' => '12',
            'phone' => '081234567893',
            'address' => 'Bendahara Street',
            'status_warga' => 'aktif',
        ]);

        $this->wargaRt1 = User::create([
            'name' => 'Warga RT 01',
            'email' => 'wargart1@erw.com',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'no_kk' => '4444444444444444',
            'no_rt' => '01',
            'no_rw' => '12',
            'phone' => '081234567894',
            'address' => 'Warga Street',
            'status_warga' => 'aktif',
        ]);
    }

    /**
     * Test Asset CRUD and bookings flow with validation.
     */
    public function test_assets_management_and_booking_validation(): void
    {
        // 1. Warga cannot create an asset
        Sanctum::actingAs($this->wargaRt1);
        $response = $this->postJson('/api/assets', [
            'name' => 'Tenda Sarnafil 4x4',
            'quantity' => 5,
            'description' => 'Tenda putih untuk hajatan',
        ]);
        $response->assertStatus(403);

        // 2. Bendahara can create an asset
        Sanctum::actingAs($this->bendahara);
        $response = $this->postJson('/api/assets', [
            'name' => 'Tenda Sarnafil 4x4',
            'quantity' => 5,
            'description' => 'Tenda putih untuk hajatan',
        ]);
        $response->assertStatus(201);
        $assetId = $response->json('data.id');

        // 3. Super Admin can update the asset
        Sanctum::actingAs($this->superAdmin);
        $response = $this->putJson("/api/assets/{$assetId}", [
            'name' => 'Tenda Sarnafil Premium',
            'quantity' => 4, // reduce stock to 4
            'description' => 'Tenda putih premium',
        ]);
        $response->assertStatus(200);

        // 4. Warga can view assets list
        Sanctum::actingAs($this->wargaRt1);
        $response = $this->getJson('/api/assets');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $this->assertEquals('Tenda Sarnafil Premium', $response->json('0.name'));

        // 5. Warga books asset (valid booking: 2 units for 3 days)
        $startDate = now()->addDays(2)->format('Y-m-d');
        $endDate = now()->addDays(4)->format('Y-m-d');
        $response = $this->postJson('/api/assets/bookings', [
            'asset_id' => $assetId,
            'quantity' => 2,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'purpose' => 'Hajatan Khitanan',
        ]);
        $response->assertStatus(201);
        $bookingId = $response->json('data.id');

        // 6. Over-allocating stock booking fails (another warga tries to book 3 units on overlapping date, total would be 2+3=5, which exceeds stock of 4)
        $anotherWarga = User::create([
            'name' => 'Another Warga',
            'email' => 'another@erw.com',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'no_kk' => '4444444444444445',
            'no_rt' => '01',
            'no_rw' => '12',
            'phone' => '081234567895',
            'address' => 'Another Street',
            'status_warga' => 'aktif',
        ]);
        Sanctum::actingAs($anotherWarga);
        
        $response = $this->postJson('/api/assets/bookings', [
            'asset_id' => $assetId,
            'quantity' => 3,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'purpose' => 'Pesta pernikahan',
        ]);
        $response->assertStatus(422); // Stock insufficient

        // 7. Bendahara approves booking
        Sanctum::actingAs($this->bendahara);
        $response = $this->putJson("/api/assets/bookings/{$bookingId}/status", [
            'status' => 'approved',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('asset_bookings', [
            'id' => $bookingId,
            'status' => 'approved',
        ]);

        // 8. Super Admin marks as returned
        Sanctum::actingAs($this->superAdmin);
        $response = $this->putJson("/api/assets/bookings/{$bookingId}/status", [
            'status' => 'returned',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('asset_bookings', [
            'id' => $bookingId,
            'status' => 'returned',
        ]);
    }

    /**
     * Test UMKM listing workflow, approval and deletion.
     */
    public function test_umkm_listings_workflow(): void
    {
        // 1. Warga submits a UMKM listing (pending status by default)
        Sanctum::actingAs($this->wargaRt1);
        $response = $this->postJson('/api/umkm', [
            'name' => 'Lapis Legit Enak',
            'price' => 75000,
            'phone_number' => '081234567899',
            'description' => 'Kue basah lapis legit premium dibuat fresh.',
        ]);
        $response->assertStatus(201);
        $listingId = $response->json('data.id');

        // Verify phone formatting (starts with 62 instead of 0)
        $this->assertEquals('6281234567899', $response->json('data.phone_number'));

        // 2. Listing is pending, so it should not show up in the public approved catalogue
        $response = $this->getJson('/api/umkm');
        $response->assertStatus(200);
        $response->assertJsonCount(0); // empty list since it is still pending

        // 3. Warga can see their own listings
        $response = $this->getJson('/api/umkm/my-listings');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $this->assertEquals('pending', $response->json('0.status'));

        // 4. Admin RT 01 can view pending listings
        Sanctum::actingAs($this->adminRt1);
        $response = $this->getJson('/api/umkm/pending');
        $response->assertStatus(200);
        $response->assertJsonCount(1);

        // 5. Admin RT 01 approves the listing
        $response = $this->putJson("/api/umkm/{$listingId}/status", [
            'status' => 'approved',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('umkm_listings', [
            'id' => $listingId,
            'status' => 'approved',
        ]);

        // 6. Now the listing shows up in the public approved catalogue for anyone
        Sanctum::actingAs($this->wargaRt1);
        $response = $this->getJson('/api/umkm');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $this->assertEquals('Lapis Legit Enak', $response->json('0.name'));

        // 7. Warga (owner) can delete their listing
        Sanctum::actingAs($this->wargaRt1);
        $response = $this->deleteJson("/api/umkm/{$listingId}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('umkm_listings', [
            'id' => $listingId,
        ]);
    }

    /**
     * Test Ronda schedule management by RT.
     */
    public function test_ronda_scheduling(): void
    {
        // 1. Admin RT 01 schedules a Ronda for RT 01
        Sanctum::actingAs($this->adminRt1);
        $response = $this->postJson('/api/ronda', [
            'day_of_week' => 'Senin',
            'no_rt' => '01',
            'warga_names' => 'Budi, Agus, Candra',
        ]);
        $response->assertStatus(200);

        // 2. Admin RT 01 tries to schedule Ronda for RT 02 (fails with 403)
        $response = $this->postJson('/api/ronda', [
            'day_of_week' => 'Selasa',
            'no_rt' => '02',
            'warga_names' => 'Dedi, Eko, Feri',
        ]);
        $response->assertStatus(403);

        // 3. Super Admin can schedule Ronda for any RT (e.g., RT 02)
        Sanctum::actingAs($this->superAdmin);
        $response = $this->postJson('/api/ronda', [
            'day_of_week' => 'Selasa',
            'no_rt' => '02',
            'warga_names' => 'Dedi, Eko, Feri',
        ]);
        $response->assertStatus(200);

        // 4. Warga RT 01 views their schedule (automatically filtered by their RT 01 by default)
        Sanctum::actingAs($this->wargaRt1);
        $response = $this->getJson('/api/ronda');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $this->assertEquals('01', $response->json('0.no_rt'));
        $this->assertEquals('Budi, Agus, Candra', $response->json('0.warga_names'));

        // 5. Super Admin deletes schedule
        Sanctum::actingAs($this->superAdmin);
        $rondaSchedule = RondaSchedule::first();
        $response = $this->deleteJson("/api/ronda/{$rondaSchedule->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('ronda_schedules', [
            'id' => $rondaSchedule->id,
        ]);
    }
}
