import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export default function SuccessPage() {
  return (
    <Suspense fallback={<p style={{ padding: "40px" }}>Loading...</p>}>
      <SuccessContent />
    </Suspense>
  );
}
