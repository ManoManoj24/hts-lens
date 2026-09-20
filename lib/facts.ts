import {FACT_KEYS, type FactKey, type ProductFacts} from './types.ts';

export function emptyFacts(): ProductFacts {
  return {material: '', use: '', construction: '', form: '', dimensions: '', power: ''};
}

export function factEntries(): Array<{key: FactKey; label: string; placeholder: string}> {
  return [
    {key: 'material', label: 'Material', placeholder: 'e.g. stoneware ceramic'},
    {key: 'use', label: 'Principal use', placeholder: 'e.g. hot drink mug'},
    {key: 'construction', label: 'How it is made', placeholder: 'e.g. glazed, fired ceramic'},
    {key: 'form', label: 'Form / presentation', placeholder: 'e.g. single handled vessel'},
    {key: 'dimensions', label: 'Size / capacity', placeholder: 'e.g. 350 ml'},
    {key: 'power', label: 'Power / mechanism', placeholder: 'e.g. none'},
  ];
}

export {FACT_KEYS};
