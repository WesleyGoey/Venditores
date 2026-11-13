import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h11l6 19 6-19h11L25.5 37h-11z" />
        </svg>
    );
}
