import { Check, Minus, MoveRight, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function Pricing() {
    return (
        <div className="w-full py-20 lg:py-40">
            <div className="container mx-auto">
                <div className="flex text-center justify-center items-center gap-4 flex-col">
                    <Badge>Beta Access</Badge>
                    <div className="flex gap-2 flex-col">
                        <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-center font-regular">
                            Currently Free During Beta!
                        </h2>
                        <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl text-center">
                            We're in beta and all features are available for free. Try it out and help us improve!
                        </p>
                    </div>
                    <div className="grid text-left w-full grid-cols-3 lg:grid-cols-4 divide-x pt-20">
                        <div className="col-span-3 lg:col-span-1"></div>
                        <div className="px-3 py-1 md:px-6 md:py-4  gap-2 flex flex-col">
                            <p className="text-2xl">Startup</p>
                            <p className="text-sm text-muted-foreground">
                                Perfect for small teams and individual developers getting started.
                            </p>
                            <p className="flex flex-col lg:flex-row lg:items-center gap-2 text-xl mt-8">
                                <span className="text-4xl">Free</span>
                                <span className="text-sm text-muted-foreground">during beta</span>
                            </p>
                            <Button variant="outline" className="gap-4 mt-8">
                                Try it <MoveRight className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 gap-2 flex flex-col">
                            <p className="text-2xl">Growth</p>
                            <p className="text-sm text-muted-foreground">
                                Ideal for growing teams with advanced collaboration needs.
                            </p>
                            <p className="flex flex-col lg:flex-row lg:items-center gap-2 text-xl mt-8">
                                <span className="text-4xl">$9</span>
                                <span className="text-sm text-muted-foreground">per month</span>
                            </p>
                            <Button className="gap-4 mt-8">
                                Try it <MoveRight className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 gap-2 flex flex-col">
                            <p className="text-2xl">Enterprise</p>
                            <p className="text-sm text-muted-foreground">
                                For large organizations requiring maximum scalability and support.
                            </p>
                            <p className="flex flex-col lg:flex-row lg:items-center gap-2 text-xl mt-8">
                                <span className="text-4xl">$50 or more</span>
                                <span className="text-sm text-muted-foreground">per month</span>
                            </p>
                            <Button variant="outline" className="gap-4 mt-8">
                                Contact us <PhoneCall className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="px-3 lg:px-6 col-span-3 lg:col-span-1  py-4">
                            <b>Features</b>
                        </div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4">Integrations</div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4">
                            AI Assistant
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4">
                            Version Control
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4">
                            Members
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <p className="text-muted-foreground text-sm">5 </p>
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <p className="text-muted-foreground text-sm">20</p>
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <p className="text-muted-foreground text-sm">Unlimited</p>
                        </div>
                        <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4">
                            Realtime Collaboration
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { Pricing }; 