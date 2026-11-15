import { fromSxzz } from '@magicdawn/eslint-config'
import { globalIgnores } from 'eslint/config'

export default fromSxzz(undefined, [
  globalIgnores(['./generators/**']),
  {
    rules: {
      'e18e/ban-dependencies': [
        'error',
        {
          allowed: ['axios', 'fast-glob', 'fs-extra'],
        },
      ],
    },
  },
])
