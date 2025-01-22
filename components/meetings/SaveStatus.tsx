interface SaveStatusProps {
    lastSaved: Date | null;
    isSaving: boolean;
}

export function SaveStatus({ lastSaved, isSaving }: SaveStatusProps) {
    return (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
            {isSaving ? (
                <>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </span>
                    Saving changes...
                </>
            ) : lastSaved ? (
                <>
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {`Last saved at ${new Date(lastSaved).toLocaleTimeString()}`}
                </>
            ) : null}
        </div>
    );
} 