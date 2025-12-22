'use client';

import { useState } from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Menu } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { AuthButtons } from './AuthButtons';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function Header() {
  const [open, setOpen] = useState(false);
  const currentUser = useQuery(api.users.getCurrentUser);
  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      {isAdmin && (
        <Drawer direction="left" open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Menu</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <ul className="space-y-2">
                <li><a href="/" className="text-foreground hover:text-primary">Home</a></li>
                <li><a href="/upload/excel-view" className="text-foreground hover:text-primary">Upload</a></li>
              </ul>
            </div>
          </DrawerContent>
        </Drawer>
      )}
      <header className="sticky top-0 z-50 w-full flex justify-between items-center p-2 sm:p-4 bg-background shadow-sm">
        <div className="flex items-center">
          {isAdmin && <Menu onClick={() => setOpen(true)} className="cursor-pointer h-6 w-6 mr-2 text-foreground" />}
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">
            DS
          </h1>
        </div>
        <div className="flex items-center">
          <SignedOut>
            <AuthButtons />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>
    </>
  );
}