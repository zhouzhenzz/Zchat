import psycopg2

try:
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='root',
        database='postgres',
        client_encoding='utf8'
    )
    print('✓ 数据库连接成功 (postgres/root)')
    conn.close()
except Exception as e:
    print(f'✗ 数据库连接失败: {type(e).__name__}')