<?php

namespace App\Services;

use App\Models\LshBucket;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Facades\Log;


class LshService
{
    private $numHashes = 100;
    private $numBands = 30;
    private $rowsPerBand;

    public function __construct()
    {
        $this->rowsPerBand = (int)($this->numHashes / $this->numBands);
    }

    public function generateSignature(User $user): array
    {
        $allTags = Tag::pluck('id')->toArray();
        $userTags = $user->tags()->pluck('id')->toArray();

        // $vector = array_map(fn($tagId) => in_array($tagId, $userTags) ? 1 : 0, $allTags);

        $signature = array_fill(0, $this->numHashes, PHP_INT_MAX);

        foreach ($userTags as $tagId) {
            $tagIndex = array_search($tagId, $allTags);

            for ($i = 0; $i < $this->numHashes; $i++) {
                $hash = $this->hashFunction($tagIndex, $i);
                if ($hash < $signature[$i]) {
                    $signature[$i] = $hash;
                }
            }
        }

        return $signature;
    }

    public function storeBuckets(User $user): void
    {
        $signature = $this->generateSignature($user);

        // Clear old buckets
        $user->buckets()->delete();

        // Create new buckets
        $bands = array_chunk($signature, $this->rowsPerBand);

        foreach ($bands as $bandIndex => $band) {
            $bucketKey = 'band_' . $bandIndex . '_' . md5(implode(',', $band));

            LshBucket::create([
                'user_id' => $user->id,
                'bucket_key' => $bucketKey
            ]);
        }
    }

    public function findPotentialMatches(User $user, int $limit = 10): array
    {
        $this->storeBuckets($user);

        $matchingBuckets = $user->buckets()->pluck('bucket_key');

        $candidates = LshBucket::whereIn('bucket_key', $matchingBuckets)
            ->where('user_id', '!=', $user->id)
            ->groupBy('user_id')
            ->selectRaw('user_id, COUNT(*) as shared_buckets')
            ->orderByDesc('shared_buckets')
            ->limit($limit)
            ->pluck('user_id')
            ->toArray();

        Log::debug("LSH candidates for user {$user->id}: " . json_encode($candidates));
        return $candidates;
    }

    private function hashFunction(int $x, int $i): int
    {
        // Use different hash functions for each index
        $a = (($i * 1664525) + 1013904223) % 4294967296;
        $b = (($i * 1103515245) + 12345) % 4294967296;
        return ($a * $x + $b) % 4294967296;
    }
}
