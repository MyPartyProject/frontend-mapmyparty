import { useQuery } from "@tanstack/react-query";
import { GetState, GetCity } from "react-country-state-city";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIA_COUNTRY_ID, findLocation, sortLocations } from "@/utils/indiaLocation";

const source = `${import.meta.env.BASE_URL}data/india`;

function LocationField({ id, label, value, options, query, disabled, required, onChange, placeholder, className, menuClassName, error }) {
  const selected = findLocation(options, value);
  const savedValue = value && !selected;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required ? " *" : ""}</Label>
      <Select value={selected?.name || value || ""} onValueChange={onChange} disabled={disabled || query.isFetching} required={required}>
        <SelectTrigger id={id} className={className} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}>
          <SelectValue placeholder={query.isFetching ? "Loading…" : placeholder} />
        </SelectTrigger>
        <SelectContent className={menuClassName}>
          {savedValue && <SelectItem value={value} disabled>{value} (saved)</SelectItem>}
          {options.map((option) => <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {!required && value && <button type="button" className="text-xs underline" disabled={disabled} onClick={() => onChange("")}>Clear {label.toLowerCase()}</button>}
      {savedValue && !query.isFetching && !query.isError && <p className="text-xs text-muted-foreground">Saved value retained. Select from the list to change it.</p>}
      {query.isError && <p role="alert" className="text-sm text-destructive">Unable to load {label.toLowerCase()} options. <button type="button" className="underline" onClick={() => query.refetch()}>Retry</button></p>}
      {!disabled && query.isSuccess && options.length === 0 && <p role="status" className="text-sm text-muted-foreground">No {label.toLowerCase()} options available.</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// Controlled names keep the existing API payloads and saved values unchanged.
export default function IndiaLocationFields({ state = "", city, onChange, idPrefix, required = false, disabled = false, className, menuClassName, errors = {} }) {
  const withCity = city !== undefined;
  const states = useQuery({
    queryKey: ["india-states"],
    queryFn: async () => sortLocations(await GetState(INDIA_COUNTRY_ID, source)),
    staleTime: Infinity,
  });
  const selectedState = findLocation(states.data || [], state);
  const cities = useQuery({
    queryKey: ["india-cities", selectedState?.id],
    queryFn: async () => sortLocations(await GetCity(INDIA_COUNTRY_ID, selectedState.id, source)),
    enabled: withCity && Boolean(selectedState),
    staleTime: Infinity,
  });
  return (
    <>
      <LocationField id={`${idPrefix}-state`} label="State" value={state} options={states.data || []} query={states}
        required={required} disabled={disabled} onChange={(value) => onChange(withCity ? { state: value, city: "" } : { state: value })}
        placeholder="Select state / union territory" className={className} menuClassName={menuClassName} error={errors.state} />
      {withCity && <LocationField id={`${idPrefix}-city`} label="City" value={city} options={cities.data || []} query={cities}
        required={required} disabled={disabled || !selectedState} onChange={(value) => onChange({ city: value })}
        placeholder={selectedState ? "Select city" : "Select state first"} className={className} menuClassName={menuClassName} error={errors.city} />}
    </>
  );
}
