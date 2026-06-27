import { CollectionForm } from "@/components/collection-form";

export default function NewCollectionPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Collection</h1>
        <p className="text-muted-foreground">
          Organize your research materials into a new collection.
        </p>
      </div>
      <CollectionForm />
    </div>
  );
}
