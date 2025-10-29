import React from 'react';

const LogoCEAVI = ({ className = "w-12 h-12", color = "white" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo exterior */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke={color}
        strokeWidth="2"
        opacity="0.3"
      />
      
      {/* Círculo interior */}
      <circle
        cx="50"
        cy="50"
        r="35"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.6"
      />
      
      {/* Símbolo de escudo */}
      <path
        d="M50 20 L35 30 L35 50 C35 60 42 68 50 70 C58 68 65 60 65 50 L65 30 Z"
        fill={color}
        opacity="0.9"
      />
      
      {/* Cruz dentro del escudo */}
      <path
        d="M50 35 L50 55 M42 45 L58 45"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      
      {/* Elementos decorativos */}
      <circle cx="30" cy="30" r="2" fill={color} opacity="0.4" />
      <circle cx="70" cy="30" r="2" fill={color} opacity="0.4" />
      <circle cx="30" cy="70" r="2" fill={color} opacity="0.4" />
      <circle cx="70" cy="70" r="2" fill={color} opacity="0.4" />
      
      {/* Texto CEAVI simplificado */}
      <text
        x="50"
        y="85"
        textAnchor="middle"
        fontSize="8"
        fill={color}
        opacity="0.7"
        fontWeight="bold"
      >
        CEAVI
      </text>
    </svg>
  );
};

export default LogoCEAVI;
