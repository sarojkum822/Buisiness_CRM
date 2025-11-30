import { AppLayout } from '@/components/layout/AppLayout';
import { ProductProvider } from '@/components/providers/ProductProvider';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppLayout>
            <ProductProvider>
                {children}
            </ProductProvider>
        </AppLayout>
    );
}
