<?php

namespace App\Http\Controllers\Api\Matches;

use App\Http\Controllers\Controller;
use App\Services\MatchingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\App;
use App\Models\Tag;
use App\Models\UserProfile;


class MatchController extends Controller
{
    private $matchingService;

    public function __construct(MatchingService $matchingService)
    {
        $this->matchingService = $matchingService;
    }

    public function getAllTags(Request $request)
    {
        $tags = Tag::all();
        return response()->json([
            'status' => 'success',
            'message' => 'Tags fetched successfully',
            'data' => $tags->map(function ($tag) {
                return [
                    'id' => $tag->id,
                    'name' => $tag->name,
                ];
            }),
        ], 200);
    }

    public function updateTags(Request $request)
    {
        /** @var User */
        $user = Auth::user();
        $tagIds = $request->input('tags', []);

        $user->tags()->syncWithoutDetaching(
            collect($tagIds)->mapWithKeys(fn($id) => [$id => ['weight' => 1.0]])
        );

        $this->matchingService->findAndStoreMatches($user);

        return response()->json(['message' => 'Tags updated successfully']);
    }

    public function findMatches()
    {
        $user = Auth::user();
        $this->matchingService->findAndStoreMatches($user);


        return response()->json([
            'message' => 'Matching process completed',
        ]);
    }

    public function getMatches()
    {
        /** @var User */
        $user = Auth::user();

        // Calculate matches first if needed (ensure all potential matches are calculated)
        $this->matchingService->findAndStoreMatches($user);

        // Get matches from matches table - only users with actual matches (score > 0)
        $matches = $user->matches()
            ->with(['user1.profile', 'user2.profile'])
            ->orderByDesc('score')
            ->get();

        // Transform and filter out admin users and users with score 0
        $transformedData = $matches->map(function ($match) use ($user) {
            $otherUser = $match->user1_id === $user->id ? $match->user2 : $match->user1;
            
            // Skip admin users
            if ($otherUser->role === 'admin') {
                return null;
            }
            
            // Only return users with actual matches (score > 0)
            if ($match->score <= 0) {
                return null;
            }
            
            return [
                'id' => $match->id,
                'user' => [
                    'id' => $otherUser->id,
                    'first_name' => $otherUser->profile->first_name ?? '',
                    'last_name' => $otherUser->profile->last_name ?? '',
                    'email' => $otherUser->email,
                    'profile_picture_url' => $otherUser->profile_picture_url,
                ],
                'score' => $match->score,
                'status' => $match->status
            ];
        })->filter()->values(); // Remove null values and reset keys

        // Sort by score descending (highest first)
        $transformedData = $transformedData->sortByDesc('score')->values();

        // Return response with metadata
        return response()->json([
            'data' => $transformedData->all(),
            'pagination' => [
                'current_page' => 1,
                'per_page' => $transformedData->count(),
                'total' => $transformedData->count(),
                'last_page' => 1,
                'from' => 1,
                'to' => $transformedData->count(),
            ]
        ]);
    }



    public function getUserByTag(Request $request)
    {
        try {
            $request->validate([
                'tag_id' => ['required', 'exists:tags,id']
            ]);

            $tag = Tag::findOrFail($request->tag_id);
            $users = $tag->users()->whereHas('profile', function ($query) {
                $query->where('status', 'Active');
            })
                ->with('profile')
                ->paginate(10);

            return response()->json([
                'status' => 'success',
                'message' => 'Users fetched successfully for tag: ' . $tag->name,
                'data' => [
                    'tag' => [
                        'id' => $tag->id,
                        'name' => $tag->name,
                    ],
                    'users' => $users->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'first_name' => $user->profile->first_name,
                            'last_name' => $user->profile->last_name,
                            'email' => $user->email,
                            'profile_picture_url' => $user->profile_picture_url,
                            'status' => $user->profile->status,
                            'last_login' => $user->last_login_at?->format('Y-m-d H:i') ?? null,
                            'join_date' => $user->created_at->format('Y-m-d'),
                            'tag_weight' => $user->pivot->weight,
                        ];
                    }),
                    'pagination' => [
                        'current_page' => $users->currentPage(),
                        'last_page' => $users->lastPage(),
                        'per_page' => $users->perPage(),
                        'total' => $users->total(),
                    ],
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while fetching users.',
                'errors' => [$e->getMessage()],
                'code' => 500,
            ], 500);
        }
    }
}
