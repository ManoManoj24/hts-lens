import {HomeClient} from './home-client';
import {getProvenance} from '../lib/provenance';

export default function Page() {
  return <HomeClient provenance={getProvenance()} />;
}
