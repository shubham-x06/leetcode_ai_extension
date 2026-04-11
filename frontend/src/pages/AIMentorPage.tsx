import EmptyCard from '../components/EmptyCard';

export default function AIMentorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI Mentor</h1>
      <EmptyCard
        icon="🤖"
        title="AI Mentor Coming Soon"
        message="Get personalized hints, solutions, and problem recommendations from our AI assistant"
      />
    </div>
  );
}