declare module 'react-native-vector-icons/FontAwesome' {
  import React from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  const Icon: React.ComponentType<IconProps>;
  export default Icon;
}

declare module 'react-native-vector-icons/FontAwesome5' {
  import React from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    solid?: boolean;
    brand?: boolean;
  }

  const Icon: React.ComponentType<IconProps>;
  export default Icon;
}

declare module 'react-native-vector-icons/Ionicons' {
  import React from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  const Icon: React.ComponentType<IconProps>;
  export default Icon;
}

declare module 'react-native-vector-icons/MaterialIcons' {
  import React from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  const Icon: React.ComponentType<IconProps>;
  export default Icon;
}

