import Link from 'next/link';
import { Github, Twitter, Globe } from 'lucide-react';

const footerNavigation = {
  main: [
    { name: 'About', href: '/about' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Support', href: '/support' },
  ],
  social: [
    {
      name: 'Twitter',
      href: '#',
      icon: Twitter,
    },
    {
      name: 'GitHub',
      href: '#',
      icon: Github,
    },
    {
      name: 'Website',
      href: '#',
      icon: Globe,
    },
  ],
};

export function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 sm:py-20 lg:px-8">
        <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer">
          {footerNavigation.main.map((item) => (
            <div key={item.name} className="pb-6">
              <Link
                href={item.href}
                className="text-sm leading-6 text-gray-600 hover:text-gray-900"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </nav>
        <div className="mt-10 flex justify-center space-x-10">
          {footerNavigation.social.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">{item.name}</span>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
        <div className="mt-10 border-t border-gray-900/10 pt-8">
          <div className="text-center">
            <p className="text-xs leading-5 text-gray-500">
              &copy; {new Date().getFullYear()} GeoGift. All rights reserved.
            </p>
            <p className="mt-2 text-xs leading-5 text-gray-400">
              Transforming passive money transfers into active, memorable experiences.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}