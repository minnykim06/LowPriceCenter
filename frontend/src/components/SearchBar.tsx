import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface Props {
  setProducts: (query: string) => void;
  setError: (error: string) => void;
}

export default function SearchBar({ setProducts, setError: _setError }: Props) {
  const [searchParams] = useSearchParams();
  const [, setQuery] = useState<string | null>(searchParams.get("query") || "");

  const handleChange = (value: string) => {
    setQuery(value);
    setProducts(value);
  };

  useEffect(() => {
    setQuery(searchParams.get("query"));
  }, [searchParams]);

  return (
    <input
      type="text"
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Search for a product..."
      className="w-full bg-[#F8F8F8] shadow-md p-3 px-6 mx-auto my-2 rounded-3xl"
    />
  );
}
