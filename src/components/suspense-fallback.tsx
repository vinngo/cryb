interface SuspenseFallbackProps {
  page?: string;
}

export default function SuspenseFallback(props: SuspenseFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full animate-pulse">
      <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
      <div className="text-lg font-semibold text-muted-foreground">
        Loading {props.page}...
      </div>
      <div className="text-sm text-muted-foreground mt-1">Please wait...</div>
    </div>
  );
}
