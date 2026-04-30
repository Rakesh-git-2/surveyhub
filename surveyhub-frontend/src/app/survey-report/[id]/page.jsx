import Content from './Content';
export function generateStaticParams() { return [{ id: 'index' }]; }
export default function Page() { return <Content />; }
