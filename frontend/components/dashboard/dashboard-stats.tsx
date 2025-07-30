'use client';

/**
 * Dashboard Statistics Component
 * 
 * Displays aggregate statistics in a card grid layout
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, Users, Activity } from 'lucide-react';
import type { DashboardStats as DashboardStatsType } from '@/types/dashboard';

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Total Gifts Sent',
      value: stats.total_gifts_sent,
      description: 'Single crypto gifts created',
      icon: Gift,
      color: 'text-cyan-400'
    },
    {
      title: 'Total Chains Sent', 
      value: stats.total_chains_sent,
      description: 'Multi-step adventures created',
      icon: TrendingUp,
      color: 'text-purple-400'
    },
    {
      title: 'GGT Tokens Spent',
      value: stats.total_ggt_spent.toFixed(2),
      description: 'Total tokens used in gifts',
      icon: Activity,
      color: 'text-green-400'
    },
    {
      title: 'Completion Rate',
      value: `${stats.completion_rate}%`,
      description: 'Gifts claimed by recipients',
      icon: Users,
      color: 'text-orange-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const IconComponent = card.icon;
        
        return (
          <Card key={index} className="bg-gray-800/50 border-gray-700 card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                {card.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}