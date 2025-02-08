import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teamApi } from "@/services/teamApi";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Team {
    id: number;
    name: string;
}

interface TeamSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTeamSelect: (teamId: number) => void;
}

type Step = 'SELECT_TEAM' | 'CREATE_TEAM' | 'JOIN_TEAM';

export function TeamSelectModal({ isOpen, onClose, onTeamSelect }: TeamSelectModalProps) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState<Step>('SELECT_TEAM');
    const [newTeamName, setNewTeamName] = useState("");
    const [teamCode, setTeamCode] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        const loadTeams = async () => {
            try {
                const userTeams = await teamApi.getUserTeams();
                setTeams(userTeams);
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: "Failed to load teams. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            loadTeams();
            setCurrentStep('SELECT_TEAM');
            setSelectedTeamId("");
            setNewTeamName("");
            setTeamCode("");
        }
    }, [isOpen, toast]);

    const handleContinue = () => {
        if (selectedTeamId) {
            onTeamSelect(Number(selectedTeamId));
        }
    };

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;

        setIsLoading(true);
        try {
            const newTeam = await teamApi.createTeam({ name: newTeamName });
            setTeams(prev => [...prev, newTeam]);
            toast({
                title: "Team Created",
                description: "Your new team has been created successfully.",
            });
            onTeamSelect(newTeam.id);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create team. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinTeam = async () => {
        if (!teamCode.trim()) return;

        setIsLoading(true);
        try {
            const joinedTeam = await teamApi.joinTeam(teamCode);
            setTeams(prev => [...prev, joinedTeam]);
            toast({
                title: "Team Joined",
                description: "You've successfully joined the team.",
            });
            onTeamSelect(joinedTeam.id);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to join team. Please check the code and try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'SELECT_TEAM':
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Select Team</DialogTitle>
                            <DialogDescription>
                                Choose a team to create a task in, or create/join a new team
                            </DialogDescription>
                        </DialogHeader>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {teams.length > 0 && (
                                    <Select
                                        value={selectedTeamId}
                                        onValueChange={setSelectedTeamId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teams.map((team) => (
                                                <SelectItem key={team.id} value={team.id.toString()}>
                                                    {team.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep('CREATE_TEAM')}
                                    >
                                        Create New Team
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep('JOIN_TEAM')}
                                    >
                                        Join Existing Team
                                    </Button>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleContinue}
                                        disabled={!selectedTeamId}
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                );

            case 'CREATE_TEAM':
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Create New Team</DialogTitle>
                            <DialogDescription>
                                Create a new team to organize your tasks
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <Input
                                placeholder="Team Name"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                            />

                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep('SELECT_TEAM')}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleCreateTeam}
                                    disabled={!newTeamName.trim() || isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Create & Continue'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                );

            case 'JOIN_TEAM':
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Join Team</DialogTitle>
                            <DialogDescription>
                                Enter the team code to join an existing team
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <Input
                                placeholder="Team Code"
                                value={teamCode}
                                onChange={(e) => setTeamCode(e.target.value)}
                            />

                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep('SELECT_TEAM')}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleJoinTeam}
                                    disabled={!teamCode.trim() || isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Join & Continue'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                {renderStep()}
            </DialogContent>
        </Dialog>
    );
} 