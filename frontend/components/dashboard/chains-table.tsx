'use client';

/**
 * Chains Table Component
 * 
 * Displays paginated list of sent or received multi-step chains
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardAPI } from '@/lib/api';
import { MapPin, ExternalLink, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface ChainsTableProps {
  type: 'sent' | 'received';
}

export function ChainsTable({ type }: ChainsTableProps) {
  const { address } = useAccount();
  const [page, setPage] = useState(0);
  const limit = 10;

  const { 
    data, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['dashboard-chains', type, address, page],
    queryFn: () => {
      const options = { skip: page * limit, limit };
      return type === 'sent' 
        ? dashboardAPI.getSentChains(options)
        : dashboardAPI.getReceivedChains(options);
    },
    enabled: !!address,
  });

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700 card-glow">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            {type === 'sent' ? 'Chains You Sent' : 'Chains You Received'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
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
            <MapPin className="w-5 h-5 mr-2" />
            {type === 'sent' ? 'Chains You Sent' : 'Chains You Received'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-400 py-8">
            <p>Error loading chains</p>
            <p className="text-sm text-gray-400 mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chains = data?.chains || [];
  const total = data?.total || 0;
  const hasMore = data?.has_more || false;

  return (
    <Card className="bg-gray-800/50 border-gray-700 card-glow">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          {type === 'sent' ? 'Chains You Sent' : 'Chains You Received'}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {total} total multi-step adventures
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chains.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No chains {type} yet</p>
            <p className="text-sm mt-2">
              {type === 'sent' ? 'Create your first adventure chain!' : 'Chain adventures you receive will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chains.map((chain) => (
              <div key={chain.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                {/* Chain Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-white font-medium">{chain.chain_title}</h3>
                      <p className="text-gray-400 text-sm">
                        {type === 'sent' ? 'To: ' : 'From: '}
                        {type === 'sent' 
                          ? `${chain.recipient_address.slice(0, 6)}...${chain.recipient_address.slice(-4)}`
                          : `${chain.recipient_address.slice(0, 6)}...${chain.recipient_address.slice(-4)}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={
                        chain.status === 'completed' 
                          ? 'text-green-400 border-green-400'
                          : chain.status === 'expired'
                            ? 'text-red-400 border-red-400'
                            : 'text-yellow-400 border-yellow-400'
                      }
                    >
                      {chain.status}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black"
                      onClick={() => window.open(chain.share_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Chain Description */}
                {chain.chain_description && (
                  <p className="text-gray-400 text-sm mb-3 italic">
                    "{chain.chain_description}"
                  </p>
                )}
                
                {/* Chain Progress */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="text-purple-400 font-bold">
                      {chain.total_value} GGT
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <TrendingUp className="w-4 h-4" />
                      {chain.current_step}/{chain.total_steps} steps
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      {chain.completion_percentage.toFixed(0)}% complete
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(chain.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
                  <div 
                    className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${chain.completion_percentage}%` }}
                  ></div>
                </div>
                
                {/* Steps Summary */}
                <div className="flex flex-wrap gap-2">
                  {chain.steps_summary.map((step, index) => (
                    <div 
                      key={index}
                      className={`flex items-center space-x-1 px-2 py-1 rounded text-xs border ${
                        step.completed 
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : 'bg-gray-600/50 border-gray-500 text-gray-400'
                      }`}
                    >
                      {step.completed && <CheckCircle className="w-3 h-3" />}
                      <span>{step.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {step.type}
                      </Badge>
                    </div>
                  ))}
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