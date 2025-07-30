'use client';

/**
 * Gifts Table Component
 * 
 * Displays paginated list of sent or received gifts
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardAPI } from '@/lib/api';
import { Gift, ExternalLink, Calendar, MapPin } from 'lucide-react';
import { useState } from 'react';

interface GiftsTableProps {
  type: 'sent' | 'received';
}

export function GiftsTable({ type }: GiftsTableProps) {
  const { address } = useAccount();
  const [page, setPage] = useState(0);
  const limit = 10;

  const { 
    data, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['dashboard-gifts', type, address, page],
    queryFn: () => {
      const options = { skip: page * limit, limit };
      return type === 'sent' 
        ? dashboardAPI.getSentGifts(options)
        : dashboardAPI.getReceivedGifts(options);
    },
    enabled: !!address,
  });

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700 card-glow">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Gift className="w-5 h-5 mr-2" />
            {type === 'sent' ? 'Gifts You Sent' : 'Gifts You Received'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800/50 border-gray-700 card-glow">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Gift className="w-5 h-5 mr-2" />
            {type === 'sent' ? 'Gifts You Sent' : 'Gifts You Received'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-400 py-8">
            <p>Error loading gifts</p>
            <p className="text-sm text-gray-400 mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const gifts = data?.gifts || [];
  const total = data?.total || 0;
  const hasMore = data?.has_more || false;

  return (
    <Card className="bg-gray-800/50 border-gray-700 card-glow">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Gift className="w-5 h-5 mr-2" />
          {type === 'sent' ? 'Gifts You Sent' : 'Gifts You Received'}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {total} total gifts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {gifts.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No gifts {type} yet</p>
            <p className="text-sm mt-2">
              {type === 'sent' ? 'Create your first gift to get started!' : 'Gifts you receive will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {gifts.map((gift) => (
              <div key={gift.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <Gift className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-cyan-400 border-cyan-400 text-xs">
                        {gift.unlock_type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={
                          gift.status === 'claimed' 
                            ? 'text-green-400 border-green-400'
                            : gift.status === 'expired'
                              ? 'text-red-400 border-red-400'
                              : 'text-yellow-400 border-yellow-400'
                        }
                      >
                        {gift.status}
                      </Badge>
                    </div>
                    
                    <p className="text-white font-medium">
                      {type === 'sent' ? 'To: ' : 'From: '}
                      {type === 'sent' 
                        ? `${gift.recipient_address.slice(0, 6)}...${gift.recipient_address.slice(-4)}`
                        : `${gift.recipient_address.slice(0, 6)}...${gift.recipient_address.slice(-4)}`
                      }
                    </p>
                    
                    {gift.message && (
                      <p className="text-gray-400 text-sm truncate mt-1">
                        "{gift.message}"
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-cyan-400 font-bold">
                      {gift.amount} {gift.currency}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(gift.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black"
                    onClick={() => window.open(gift.share_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {(page > 0 || hasMore) && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="border-gray-600 text-gray-300"
                >
                  Previous
                </Button>
                
                <span className="text-gray-400 text-sm">
                  Page {page + 1}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={!hasMore}
                  className="border-gray-600 text-gray-300"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}