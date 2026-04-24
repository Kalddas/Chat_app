<?php

namespace App\Services;

use App\Models\User;
use App\Models\Matches;
use App\Services\LshService;
use Illuminate\Support\Facades\Log;

class MatchingService
{
    private $lshService;

    public function __construct(LshService $lshService)
    {
        $this->lshService = $lshService;
    }

    public function findAndStoreMatches(User $user): void
    {
        Log::info("Finding matches for user {$user->id}");

        $candidates = $this->lshService->findPotentialMatches($user);
        Log::debug("Candidates found: " . json_encode($candidates));

        if (empty($candidates)) {
            Log::warning("No candidates found for user {$user->id}");
            // Try a fallback approach - find users with common tags
            $this->findMatchesByCommonTags($user);
            return;
        }

        foreach ($candidates as $candidateId) {
            $candidate = User::find($candidateId);
            Log::debug("Processing candidate {$candidateId}");

            $score = $this->calculateSimilarity($user, $candidate);
            Log::debug("Similarity score: {$score}");

            if ($score >= 0.0) {
                $this->createMatch($user, $candidate, $score);
                Log::info("Match created between {$user->id} and {$candidateId}");
            }
        }
    }

    public function calculateSimilarity(User $user1, User $user2): float
    {
        $tags1 = $user1->tags()->withPivot('weight')->get();
        $tags2 = $user2->tags()->withPivot('weight')->get();

        $weightedIntersection = 0;
        $weightedUnion = 0;

        $allTagIds = array_unique(
            array_merge(
                $tags1->pluck('id')->toArray(),
                $tags2->pluck('id')->toArray()
            )
        );

        foreach ($allTagIds as $tagId) {
            $weight1 = $tags1->firstWhere('id', $tagId)->pivot->weight ?? 0;
            $weight2 = $tags2->firstWhere('id', $tagId)->pivot->weight ?? 0;

            $weightedIntersection += min($weight1, $weight2);
            $weightedUnion += max($weight1, $weight2);
        }

        return $weightedUnion > 0 ? $weightedIntersection / $weightedUnion : 0;
    }

    private function createMatch(User $user1, User $user2, float $score): void
    {

        $userId1 = min($user1->id, $user2->id);
        $userId2 = max($user1->id, $user2->id);

        Matches::updateOrCreate(
            ['user1_id' => $userId1, 'user2_id' => $userId2],
            ['score' => $score, 'status' => 'Pending']
        );
    }

    private function findMatchesByCommonTags(User $user): void
    {
        Log::info("Using fallback method to find matches for user {$user->id}");
        
        $userTagIds = $user->tags()->pluck('tags.id')->toArray();
        
        if (empty($userTagIds)) {
            Log::warning("User {$user->id} has no tags");
            return;
        }

        // Find users who have at least one common tag
        $candidates = User::whereHas('tags', function ($query) use ($userTagIds) {
            $query->whereIn('tags.id', $userTagIds);
        })
        ->where('id', '!=', $user->id)
        ->get();

        Log::info("Fallback candidates found: " . $candidates->count());

        foreach ($candidates as $candidate) {
            $score = $this->calculateSimilarity($user, $candidate);
            Log::debug("Fallback similarity score: {$score}");
            
            if ($score > 0) {
                $this->createMatch($user, $candidate, $score);
                Log::info("Fallback match created between {$user->id} and {$candidate->id}");
            }
        }
    }
}
