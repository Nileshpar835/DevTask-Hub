interface PaginationProps {
    page: number;
    totalpages: number;
    onPageChange: (newPage: number) => void;
}

export function Pagination({ page, totalpages, onPageChange }: PaginationProps) {
    if (totalpages <= 1) return null;

    return (
        <div className="pagination">
            <button
                className="btn"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}>
                Previous
            </button>
            <span className="page-indicator">
                Page{page} of {totalpages}
            </span>
            <button className="btn"
                disabled={page >= totalpages}
                onClick={() => onPageChange(page + 1)}>
                Next
            </button>
        </div>
    )
}