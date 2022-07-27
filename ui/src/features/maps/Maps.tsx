import { useMaps } from './useMaps';

export const Maps = () => {
  const { isLoading, error, data } = useMaps();

  return (
    <section>
      <header></header>
      <div></div>
      <footer></footer>
    </section>
  );
};
