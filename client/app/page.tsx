'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, FolderKanban, BarChart3, Briefcase, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Build Your DevOps Portfolio
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Showcase your skills, get scored on real projects, and connect with top companies
          </p>
          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Learn DevOps</CardTitle>
              <CardDescription>
                Complete lessons and master DevOps concepts
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FolderKanban className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Build Projects</CardTitle>
              <CardDescription>
                Work on real-world DevOps projects
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Get Scored</CardTitle>
              <CardDescription>
                Receive detailed AI-powered feedback
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Briefcase className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Create Portfolio</CardTitle>
              <CardDescription>
                Showcase your work to employers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Connect</CardTitle>
              <CardDescription>
                Get discovered by top companies
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
