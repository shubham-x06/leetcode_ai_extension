interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function Skeleton({ width = '100%', height = '20px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-300 rounded animate-pulse ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}