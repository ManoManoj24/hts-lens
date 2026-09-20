import type {FormEvent} from 'react';
import {factEntries} from '../../lib/facts';
import type {ProductFacts, ProductFamily, SearchFilters} from '../../lib/types';

const EXAMPLES = ['laptop', 'ceramic mug', 'cotton t-shirt', 'solar panel'] as const;

const FAMILIES: Array<{value: ProductFamily; label: string}> = [
  {value: 'all', label: 'All HTS chapters'},
  {value: 'food', label: 'Food & agricultural goods'},
  {value: 'textiles', label: 'Textiles & apparel'},
  {value: 'bags', label: 'Bags, leather & footwear'},
  {value: 'ceramics', label: 'Ceramics & glass'},
  {value: 'machinery', label: 'Machinery & electronics'},
  {value: 'transport', label: 'Vehicles & transport'},
  {value: 'furniture', label: 'Furniture, toys & miscellaneous'},
];

type SearchFormProps = {
  q: string;
  loading: boolean;
  ai: boolean;
  family: ProductFamily;
  strictFamily: boolean;
  facts: ProductFacts;
  filters: SearchFilters;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onExample: (value: string) => void;
  onFamilyChange: (value: ProductFamily) => void;
  onStrictFamilyChange: (value: boolean) => void;
  onFiltersChange: (value: SearchFilters) => void;
  onAiChange: (value: boolean) => void;
  onFactChange: (key: keyof ProductFacts, value: string) => void;
};

export function SearchForm(props: SearchFormProps) {
  const {q, loading, ai, family, strictFamily, facts, filters} = props;
  return (
    <form className="search-form" onSubmit={props.onSubmit}>
      <input
        name="q"
        aria-label="Product description"
        value={q}
        onChange={event => props.onQueryChange(event.target.value)}
        placeholder="Describe a product or paste an HTS number"
      />
      <div className="examples">
        Try {EXAMPLES.map(example => (
          <button key={example} type="button" onClick={() => props.onExample(example)}>{example}</button>
        ))}
      </div>
      <div className="family-focus">
        <label>
          <span>Product family</span>
          <select
            value={family}
            onChange={event => props.onFamilyChange(event.target.value as ProductFamily)}
          >
            {FAMILIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        {family !== 'all' && (
          <label className="strict-family">
            <input type="checkbox" checked={strictFamily} onChange={event => props.onStrictFamilyChange(event.target.checked)} />
            Search only this family’s chapters
          </label>
        )}
        <small>
          {strictFamily
            ? 'Strict chapter scope is on. Turn it off if the product could classify elsewhere.'
            : 'Selected chapters are boosted, but cross-chapter matches remain visible.'}
        </small>
      </div>
      <div className="filters">
        <label>
          <input type="checkbox" checked={filters.commercial} onChange={event => props.onFiltersChange({...filters, commercial: event.target.checked})} />
          Commercial lines only
        </label>
        <label>
          <input type="checkbox" checked={filters.exclude99} onChange={event => props.onFiltersChange({...filters, exclude99: event.target.checked})} />
          Exclude Chapter 99
        </label>
        <label>
          <input type="checkbox" checked={filters.statistical} onChange={event => props.onFiltersChange({...filters, statistical: event.target.checked})} />
          Statistical suffixes only
        </label>
      </div>
      <div className="ai-toggle">
        <label>
          <input type="checkbox" checked={ai} onChange={event => props.onAiChange(event.target.checked)} />
          AI Assist <span>beta</span>
        </label>
        <small>Optional semantic comparison of retrieved candidates. Product and candidate text is sent to TypeSafe.</small>
      </div>
      {ai && (
        <fieldset className="fact-panel">
          <legend>Product facts <span>optional - more detail helps Jev decide</span></legend>
          <div className="fact-grid">
            {factEntries().map(field => (
              <label key={field.key}>
                <span>{field.label}</span>
                <input
                  name={field.key}
                  value={facts[field.key]}
                  onChange={event => props.onFactChange(field.key, event.target.value)}
                  placeholder={field.placeholder}
                />
              </label>
            ))}
          </div>
          <p>Only filled facts are sent. Leave anything unknown blank.</p>
        </fieldset>
      )}
      <button type="submit" className="search-submit">{loading ? 'Searching…' : 'Search HTS'}</button>
      <p className="code-hint">Already have a code? Paste it above to open the matching schedule lines.</p>
    </form>
  );
}
