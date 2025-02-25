"use client"
import Layout from "@/components/Layout";
import { FaqSection } from "@/components/ui/faq";
import { useToast } from "@/hooks/use-toast";

export default function SupportPage() {
    const { toast } = useToast();

    const faqItems = [
        {
            question: "What makes Agilee different?",
            answer: "Agilee aims to solve the problem of having to switch between different tools, such as Google Docs, in cases where you need to capture information in the meetings and create tasks on the go. Agilee is a collaborative note-taking platform that allows you to work together with your team to capture, organize, and share your thoughts effectively. It combines powerful features with an intuitive interface to help you fast track your team's progress."
        },
        {
            question: "What is the real-time collaboration feature?",
            answer: "Our real-time collaboration feature allows multiple team members to work together simultaneously on meeting notes. You can see everyone's cursors in real-time, create and assign tasks during meetings, track meeting duration and participants, and all changes sync instantly across all users."
        },
        {
            question: "How do I create and manage tasks during meetings?",
            answer: "During meetings, you can create tasks by using the '/' command in the note editor and selecting 'Create Task', or by using the '#' symbol to mention existing tasks. Tasks can be organized into Todo, Done, and Blockers sections, and you can assign them to team members using the '@' mention feature."
        },
        {
            question: "How does the note organization system work?",
            answer: "Our note-taking system features a structured organization with different sections for Todos, Done items, and Blockers. Each note supports rich text formatting, task mentions, user mentions, and real-time collaboration. Notes are automatically saved and synced across all participants."
        },
        {
            question: "What keyboard shortcuts are available?",
            answer: "You can use '@' to mention team members, '#' to reference tasks, and '/' to access quick commands like creating tasks or inserting dates. The editor also supports standard formatting shortcuts like bold, italic, and lists."
        },
        {
            question: "How does the auto-save feature work?",
            answer: "All your notes are automatically saved in real-time as you type. The system maintains a persistent connection and ensures your work is never lost, even if you temporarily lose internet connectivity."
        },
        {
            question: "Can I use the app offline?",
            answer: "While the app requires an internet connection for real-time collaboration features, we automatically sync your changes once you're back online, ensuring you never lose your work."
        }
    ];

    return (
        <Layout>
            <div className="min-h-screen w-full">
                <FaqSection
                    title="Frequently Asked Questions"
                    description="Get answers to common questions about using our collaborative note-taking platform"
                    items={faqItems}
                    contactInfo={{
                        title: "Still need help?",
                        description: "Our support team is here to assist you with any questions or concerns (temporarily, for any problems/inqueries/suggestions, please contact evan.hhuang@outlook.com",
                        buttonText: "Contact Support",
                        onContact: () => {
                            toast({
                                title: "Support Request",
                                description: "Not available in Beta.",
                            });
                        }
                    }}
                />
            </div>
        </Layout>
    )
}       