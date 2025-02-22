"use client"

import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function JoinUsPage() {
    return (
        <Layout>
            <div className="min-h-[80vh] w-full flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl mx-auto text-center"
                >
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent">
                        Join Our Team
                    </h1>
                    <p className="text-xl text-muted-foreground mb-6">
                        We're preparing to launch exciting opportunities
                    </p>
                    <div className="space-y-4">
                        <p className="text-base text-muted-foreground">
                            While we're not actively hiring right now, we're building something special
                            and will be opening positions soon. Stay tuned for opportunities in engineering,
                            design, and product roles.
                        </p>
                        <div className="mt-8">
                            <Button className="gap-2" disabled>
                                <Mail className="h-4 w-4" />
                                Get notified about positions
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </Layout>
    )
}       
