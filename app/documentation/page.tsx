"use client"

import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const formatText = (text: string) => {
    // Replace **text** with <strong>text</strong>
    return text.replace(/\*\*(.*?)\*\*/g, (_, p1) => p1);
};

// Documentation sections with complete articles
const documentationSections = [
    {
        title: "Getting Started",
        items: [
            {
                title: "Introduction",
                content: `# Welcome to Agilee

Your modern solution for note-taking and team collaboration. Agilee combines powerful features with an intuitive interface to help you capture, organize, and share your thoughts effectively.

## Key Benefits

• Clean, distraction-free writing environment
  Experience focused writing with our minimalist interface

• Real-time collaboration with team members
  Work together seamlessly in real-time

• Powerful organization tools
  Keep your notes structured and easily accessible

• Secure data storage
  Your data is encrypted and safely stored

• Cross-platform accessibility
  Access your notes from any device, anywhere`
            },
            {
                title: "Quick Start",
                content: `# Getting Started with Agilee

Follow these simple steps to begin your journey with Agilee.

## 1. Sign Up

• **Visit the signup page**
  Head to our secure registration portal
• **Create your account**
  Use your email or Google account
• **Verify your email**
  Click the verification link in your inbox

## 2. Create Your First Note

• **Access the dashboard**
  Click the "+" button to start
• **Choose a title**
  Give your note a meaningful name
• **Start writing**
  Use our intuitive rich text editor
• **Auto-save enabled**
  Your work is saved automatically

## 3. Organize Your Work

• **Create folders**
  Structure your notes logically
• **Add tags**
  Categorize for easy finding
• **Pin important notes**
  Keep crucial information accessible

## 4. Collaborate with Others

• **Team invitations**
  Send via email
• **Set permissions**
  Control access levels
• **Real-time collaboration**
  Work together seamlessly`
            }
        ]
    },
    {
        title: "Features",
        items: [
            {
                title: "Note Taking",
                content: `# Powerful Note-Taking Experience

## Rich Text Editor

• **Text Formatting**
  Bold, italic, and underline with keyboard shortcuts
  
• **Lists & Structure**
  Create organized bullet and numbered lists
  
• **Media Support**
  Insert images and attachments seamlessly
• **Code Blocks**
  Syntax highlighting for multiple languages
• **Table Support**
  Create structured data layouts

## Auto-Save Technology

• **Real-time Saving**
  Never lose your work again
• **Version History**
  Track changes over time (Premium)
• **Offline Support**
  Work without internet connection

## Template System

• **Pre-built Templates**
  Start with professional layouts
• **Custom Templates**
  Create your own reusable formats
• **Template Sharing**
  Collaborate on standardized formats`
            },
            {
                title: "Team Collaboration",
                content: `# Seamless Team Collaboration

## Real-time Collaboration

• **Simultaneous Editing**
  Multiple users can work together
• **Presence Awareness**
  See who's viewing or editing
• **Live Cursor Tracking**
  Follow team members' activities

## Sharing & Permissions

• **Granular Access Control**
  Set precise permission levels
• **Team Spaces**
  Create dedicated work areas
• **Folder Management**
  Organize team content effectively
• **Access Monitoring**
  Track document sharing

## Communication Tools

• **Contextual Comments**
  Add notes to specific sections
• **@Mentions**
  Tag team members directly
• **Resolution Tracking**
  Monitor feedback implementation
• **Smart Notifications**
  Stay updated on important changes`
            },
            {
                title: "Organization",
                content: `# Advanced Organization Tools

## Folder Management

• **Nested Structure**
  Create hierarchical organization
• **Bulk Actions**
  Manage multiple notes efficiently
• **Color Coding**
  Visual organization system
• **Smart Sorting**
  Arrange by various criteria

## Search & Discovery

• **Full-text Search**
  Find content instantly
• **Tag System**
  Flexible categorization
• **Advanced Filters**
  Combine search criteria
• **Saved Searches**
  Quick access to frequent queries

## Quick Access

• **Pinned Notes**
  Important items at your fingertips
• **Favorite Folders**
  Fast access to key sections
• **Custom Shortcuts**
  Personalized navigation
• **Recent Activity**
  Track your latest work`
            }
        ]
    },
    {
        title: "Updates & Changelog",
        items: [
            {
                title: "Upcoming",
                content: `# Initial Release

## Version 1.0.0 (March 2024)

Our initial release brings together everything you need for effective note-taking and team collaboration. We've focused on creating a solid foundation for your productivity needs.`
            },

        ]
    }
];

export default function DocumentationPage() {
    const [selectedSection, setSelectedSection] = useState("Introduction");
    const [searchQuery, setSearchQuery] = useState("");

    // Find the selected content
    const selectedArticle = documentationSections
        .flatMap(section => section.items)
        .find(item => item.title === selectedSection);

    const filteredSections = documentationSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(section => section.items.length > 0);

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="w-64 shrink-0">
                        <div className="sticky top-24">
                            <div className="mb-6">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search documentation..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <nav className="space-y-6">
                                {filteredSections.map((section) => (
                                    <div key={section.title}>
                                        <h3 className="font-medium text-muted-foreground mb-2">{section.title}</h3>
                                        <ul className="space-y-2">
                                            {section.items.map((item) => (
                                                <li key={item.title}>
                                                    <button
                                                        onClick={() => setSelectedSection(item.title)}
                                                        className={cn(
                                                            "text-sm w-full text-left px-2 py-1.5 rounded-md hover:bg-accent transition-colors",
                                                            selectedSection === item.title && "bg-accent text-accent-foreground font-medium"
                                                        )}
                                                    >
                                                        {item.title}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold tracking-tight">{selectedSection}</CardTitle>
                                <CardDescription className="text-base text-muted-foreground">
                                    Comprehensive guide and reference for {selectedSection.toLowerCase()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                    <div className="space-y-6 leading-7">
                                        {selectedArticle?.content.split('\n\n').map((paragraph, index) => {
                                            if (paragraph.startsWith('#')) {
                                                const level = paragraph.match(/^#+/)?.[0].length || 1;
                                                const text = paragraph.replace(/^#+\s/, '');
                                                return level === 1 ? (
                                                    <h1 key={index} className="text-2xl font-bold tracking-tight mt-8 mb-4">
                                                        {text}
                                                    </h1>
                                                ) : (
                                                    <h2 key={index} className="text-xl font-semibold tracking-tight mt-6 mb-3">
                                                        {text}
                                                    </h2>
                                                );
                                            }
                                            if (paragraph.startsWith('•')) {
                                                return (
                                                    <div key={index} className="pl-4 my-2">
                                                        <div className="flex gap-3">
                                                            <span className="text-primary">•</span>
                                                            <div>
                                                                {paragraph.substring(2).split('\n').map((line, i) => {
                                                                    const [title, description] = line.split('  ');
                                                                    return (
                                                                        <div key={i} className="mb-2">
                                                                            <strong className="font-medium">{formatText(title)}</strong>
                                                                            {description && (
                                                                                <p className="mt-1 text-sm text-muted-foreground">
                                                                                    {formatText(description.trim())}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return <p key={index} className="text-base leading-7">{formatText(paragraph)}</p>;
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
