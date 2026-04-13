import { cn } from '@/lib/utils';

type HealthTrendsMarkProps = {
  className?: string;
};

/** Circular HealthTrends Medical Clinics mark for headers and chrome */
export function HealthTrendsMark({ className }: HealthTrendsMarkProps) {
  return (
    <img
      src="/healthtrends-logo.png"
      alt="HealthTrends Medical Clinics"
      width={128}
      height={128}
      decoding="async"
      className={cn('shrink-0 object-contain', className)}
    />
  );
}
