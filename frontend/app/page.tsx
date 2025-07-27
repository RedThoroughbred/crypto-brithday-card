'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { 
  Gift, 
  MapPin, 
  Shield, 
  Smartphone, 
  ArrowRight,
  Check,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';

const features = [
  {
    icon: Gift,
    title: 'Crypto Gifts',
    description: 'Send cryptocurrency as memorable experiences, not just transfers.',
  },
  {
    icon: MapPin,
    title: 'Location Verified',
    description: 'Recipients must reach specific GPS coordinates to unlock their gifts.',
  },
  {
    icon: Shield,
    title: 'Smart Contract Security',
    description: 'Trustless escrow ensures funds are safe until conditions are met.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Optimized',
    description: 'Perfect for treasure hunts and real-world exploration.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Create Your Gift',
    description: 'Choose an amount, design your card, and set the treasure location.',
  },
  {
    step: '02',
    title: 'Add Clues',
    description: 'Create hints and riddles to guide the recipient to the location.',
  },
  {
    step: '03',
    title: 'Send & Share',
    description: 'Share the digital gift card and watch the adventure unfold.',
  },
  {
    step: '04',
    title: 'Claim Reward',
    description: 'Recipients visit the location and claim their crypto treasure.',
  },
];

const testimonials = [
  {
    quote: "Turned my daughter's birthday into an amazing treasure hunt. She loved solving clues to find her crypto gift!",
    author: "Sarah M.",
    role: "Parent",
    rating: 5,
  },
  {
    quote: "Perfect for team building! Our remote team had so much fun with location-based challenges.",
    author: "Mike R.",
    role: "Team Lead",
    rating: 5,
  },
  {
    quote: "Finally, a way to make crypto gifts exciting and educational. My nephew learned about Web3 while having fun!",
    author: "Alex T.",
    role: "Crypto Enthusiast",
    rating: 5,
  },
];

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <MainLayout>
      <div className="gradient-bg">
        {/* Hero Section */}
        <section className="relative px-6 pt-20 pb-24 sm:px-6 sm:pt-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Turn Crypto Gifts Into{' '}
                <span className="text-gradient">Adventures</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Transform passive money transfers into active, memorable experiences. 
                Create location-verified treasure hunts that combine the excitement of exploration 
                with the innovation of cryptocurrency.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {isConnected ? (
                  <Button asChild size="lg" className="text-lg px-8 py-4">
                    <Link href="/dashboard">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <Button 
                        onClick={openConnectModal} 
                        size="lg" 
                        className="text-lg px-8 py-4"
                      >
                        Connect Wallet
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    )}
                  </ConnectButton.Custom>
                )}
                <Button variant="outline" size="lg" asChild className="text-lg px-8 py-4">
                  <Link href="/how-it-works">Learn More</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-semibold leading-7 text-geogift-600">
                Everything you need
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Revolutionary Gifting Experience
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Combine blockchain security with real-world exploration to create unforgettable gift experiences.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="flex flex-col"
                    >
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <div className="rounded-lg bg-geogift-500 p-2">
                          <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                        </div>
                        {feature.title}
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">{feature.description}</p>
                      </dd>
                    </motion.div>
                  );
                })}
              </dl>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How GeoGift Works
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Four simple steps to create amazing treasure hunt experiences.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    className="relative"
                  >
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-geogift-500 rounded-full text-white font-bold text-lg">
                      {step.step}
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-center text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-4 text-gray-600 text-center">
                      {step.description}
                    </p>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-6 left-1/2 w-full h-0.5 bg-gray-200 transform translate-x-6" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Loved by Adventurers
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                See what our users are saying about their GeoGift experiences.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex space-x-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <blockquote className="text-gray-600 mb-4">
                        "{testimonial.quote}"
                      </blockquote>
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.author}</div>
                        <div className="text-sm text-gray-500">{testimonial.role}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-geogift-600">
          <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to Create Your First Adventure?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-geogift-200">
                Join thousands of users who have transformed their gifts into memorable experiences.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {isConnected ? (
                  <Button 
                    asChild 
                    size="lg" 
                    variant="secondary"
                    className="text-lg px-8 py-4"
                  >
                    <Link href="/create">
                      Create Your First Gift
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <Button 
                        onClick={openConnectModal} 
                        size="lg" 
                        variant="secondary"
                        className="text-lg px-8 py-4"
                      >
                        Connect Wallet to Start
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    )}
                  </ConnectButton.Custom>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}