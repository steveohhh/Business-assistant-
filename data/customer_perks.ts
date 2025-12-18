
import React from 'react';
import { Award, Zap, Shield, TrendingDown, Bell, Eye } from 'lucide-react';

export interface CustomerPerk {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType; 
  tactic: string; 
}

export const customerPerksData: CustomerPerk[] = [
  { 
    id: 'PERK_IMPULSE', 
    name: 'Impulse Buyer', 
    description: 'Prone to spontaneous, high-value purchases when presented with novelty or urgency.',
    icon: Zap,
    tactic: 'Create scarcity, showcase new arrivals, and push for immediate decisions.'
  },
  { 
    id: 'PERK_LOYALIST', 
    name: 'Brand Loyalist', 
    description: 'Sticks with trusted sources and values relationships over pure price.',
    icon: Award,
    tactic: 'Reinforce the relationship, offer "exclusive" information, and reward repeat business.'
  },
  { 
    id: 'PERK_SKEPTIC', 
    name: 'The Skeptic', 
    description: 'Questions quality, needs proof, and is wary of deals that seem too good.',
    icon: Shield,
    tactic: 'Provide data, show evidence of quality, and be transparent about product details.'
  },
  { 
    id: 'PERK_HAGGLER', 
    name: 'Born Haggler', 
    description: 'Always negotiates for a better deal, regardless of the initial offer.',
    icon: TrendingDown,
    tactic: 'Start with a slightly higher price to create room for a controlled, "special" discount.'
  },
  { 
    id: 'PERK_FLIGHT_RISK', 
    name: 'Flight Risk', 
    description: 'High churn probability; easily spooked by pressure or perceived instability.',
    icon: Bell,
    tactic: 'Avoid high-pressure tactics. Offer reassurance and build a sense of security.'
  },
  { 
    id: 'PERK_INFLUENCER', 
    name: 'Street Influencer', 
    description: 'Their opinion carries weight with others in their circle. A valuable node.',
    icon: Eye,
    tactic: 'Treat as a VIP. Their satisfaction is a marketing investment. Consider better deals.'
  },
];